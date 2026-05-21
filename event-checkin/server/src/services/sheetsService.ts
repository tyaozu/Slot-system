import path from "path";
import Fuse from "fuse.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { google } from "googleapis";
import wanakana from "wanakana";

dayjs.extend(utc);
dayjs.extend(timezone);

export type CustomerRecord = {
  row: number;
  顧客番号: string;
  氏名: string;
  ふりがな: string;
  メールアドレス: string;
  電話番号: string;
  店舗: string;
  担当者: string;
  同伴者の人数: number;
  お酒が飲めるか: string;
  チェックイン済み: string;
  チェックイン時刻: string;
};

const REQUIRED_ENV = [
  "GOOGLE_SPREADSHEET_ID",
  "GOOGLE_SERVICE_ACCOUNT_KEY_PATH"
] as const;

const CACHE_MS = 30_000;

let cache: { expiresAt: number; customers: CustomerRecord[] } | null = null;

function normalizeAlcoholFlag(value: string): string {
  const normalized = value.trim();
  if (["○", "◯", "〇", "⚪", "⚪︎"].includes(normalized)) {
    return "○";
  }
  if (["×", "✕", "✖"].includes(normalized)) {
    return "×";
  }
  return normalized;
}

function assertEnv(name: (typeof REQUIRED_ENV)[number]): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getSheetsClient() {
  const keyPath = assertEnv("GOOGLE_SERVICE_ACCOUNT_KEY_PATH");
  const absoluteKeyPath = path.resolve(process.cwd(), keyPath);
  const auth = new google.auth.GoogleAuth({
    keyFile: absoluteKeyPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return google.sheets({ version: "v4", auth });
}

function parseCustomers(values: string[][]): CustomerRecord[] {
  return values
    .slice(1)
    .map((row, index) => {
      const rowNum = index + 2;
      const companionsRaw = row[7] ?? "0";
      const companions = Number.parseInt(companionsRaw, 10);

      return {
        row: rowNum,
        顧客番号: row[0] ?? "",
        氏名: row[1] ?? "",
        ふりがな: row[2] ?? "",
        メールアドレス: row[3] ?? "",
        電話番号: row[4] ?? "",
        店舗: row[5] ?? "",
        担当者: row[6] ?? "",
        同伴者の人数: Number.isNaN(companions) ? 0 : companions,
        お酒が飲めるか: normalizeAlcoholFlag(row[8] ?? ""),
        チェックイン済み: row[9] ?? "",
        チェックイン時刻: row[10] ?? ""
      };
    })
    .filter((customer) => customer.顧客番号 || customer.氏名 || customer.ふりがな);
}

export async function getAllCustomers(): Promise<CustomerRecord[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.customers;
  }

  const spreadsheetId = assertEnv("GOOGLE_SPREADSHEET_ID");
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "A:K"
  });

  const values = response.data.values as string[][] | undefined;
  const customers = parseCustomers(values ?? []);

  cache = {
    customers,
    expiresAt: Date.now() + CACHE_MS
  };

  return customers;
}

export function clearCustomerCache() {
  cache = null;
}

function uniqueQueries(query: string): string[] {
  const candidates = [
    query,
    wanakana.toHiragana(query),
    wanakana.toKatakana(query),
    query.toLowerCase()
  ].map((item) => item.trim());

  return Array.from(new Set(candidates.filter(Boolean)));
}

export function searchCustomers(customers: CustomerRecord[], query: string): CustomerRecord[] {
  const patterns = uniqueQueries(query);
  if (!patterns.length) {
    return [];
  }

  const fuse = new Fuse(customers, {
    keys: [
      { name: "氏名", weight: 0.5 },
      { name: "ふりがな", weight: 0.5 }
    ],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 1
  });

  const pickedRows = new Set<number>();
  const output: CustomerRecord[] = [];

  for (const pattern of patterns) {
    const result = fuse.search(pattern);
    for (const item of result) {
      const row = item.item.row;
      if (pickedRows.has(row)) {
        continue;
      }
      pickedRows.add(row);
      output.push(item.item);
      if (output.length >= 5) {
        return output;
      }
    }
  }

  return output.slice(0, 5);
}

export async function getCheckinStats() {
  const customers = await getAllCustomers();
  const checkedIn = customers.filter((item) => item.チェックイン済み === "済").length;
  return {
    checkedIn,
    total: customers.length
  };
}

export async function checkInCustomer(row: number) {
  const spreadsheetId = assertEnv("GOOGLE_SPREADSHEET_ID");
  const sheets = getSheetsClient();
  const current = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `J${row}:K${row}`
  });
  const currentValues = (current.data.values?.[0] ?? ["", ""]) as string[];
  if (currentValues[0] === "済") {
    return { alreadyCheckedIn: true as const };
  }

  const timestamp = dayjs().tz("Asia/Tokyo").format("YYYY-MM-DDTHH:mm:ssZ");
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `J${row}:K${row}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [["済", timestamp]]
    }
  });

  clearCustomerCache();
  return {
    alreadyCheckedIn: false as const,
    timestamp
  };
}
