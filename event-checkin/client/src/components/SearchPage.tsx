import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Customer } from "../App";
import CustomerCard from "./CustomerCard";
import CheckinModal from "./CheckinModal";
import { apiPath } from "../lib/api";

type Props = {
  onLogout: () => void;
};

type Stats = {
  checkedIn: number;
  total: number;
};

function SearchPage({ onLogout }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<Stats>({ checkedIn: 0, total: 0 });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchStats = async () => {
    const response = await fetch(apiPath("/search/stats"), { credentials: "include" });
    if (!response.ok) {
      throw new Error("failed stats");
    }
    const data = (await response.json()) as Stats;
    setStats(data);
  };

  useEffect(() => {
    void fetchStats().catch(() => {
      setMessage("サーバーとの接続に失敗しました。再度お試しください。");
    });
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const run = async () => {
        setLoading(true);
        setMessage("");
        try {
          const response = await fetch(`${apiPath("/search")}?q=${encodeURIComponent(query)}`, {
            credentials: "include"
          });
          if (response.status === 401) {
            onLogout();
            navigate("/", { replace: true });
            return;
          }
          if (!response.ok) {
            throw new Error("search_error");
          }
          const data = (await response.json()) as { results: Customer[] };
          setResults(data.results);
        } catch {
          setMessage("サーバーとの接続に失敗しました。再度お試しください。");
        } finally {
          setLoading(false);
        }
      };
      void run();
    }, 300);

    return () => clearTimeout(timer);
  }, [navigate, onLogout, query]);

  const handleLogout = async () => {
    await fetch(apiPath("/auth/logout"), {
      method: "POST",
      credentials: "include"
    });
    onLogout();
    navigate("/", { replace: true });
  };

  const openCheckinModal = async (customer: Customer) => {
    if (customer.チェックイン済み === "済") {
      return;
    }
    setSelectedCustomer(customer);
  };

  const confirmCheckin = async () => {
    if (!selectedCustomer) {
      return;
    }
    setCheckinLoading(true);
    setMessage("");
    try {
      const response = await fetch(apiPath("/checkin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ row: selectedCustomer.row })
      });

      if (response.status === 409) {
        setMessage("このお客様はすでにチェックイン済みです。");
        setSelectedCustomer(null);
        return;
      }
      if (response.status === 503) {
        setMessage("サーバーとの接続に失敗しました。再度お試しください。");
        return;
      }
      if (!response.ok) {
        throw new Error("checkin_error");
      }

      const data = (await response.json()) as { success: boolean; timestamp: string };
      if (data.success) {
        setResults((prev) =>
          prev.map((item) =>
            item.row === selectedCustomer.row
              ? { ...item, チェックイン済み: "済", チェックイン時刻: data.timestamp }
              : item
          )
        );
        await fetchStats();
      }
      setSelectedCustomer(null);
    } catch {
      setMessage("サーバーとの接続に失敗しました。再度お試しください。");
    } finally {
      setCheckinLoading(false);
    }
  };

  const noResultMessage = useMemo(() => {
    if (loading || query.trim().length < 2) {
      return "";
    }
    if (results.length === 0) {
      return "該当するお客様が見つかりません。別のお名前でお試しください。";
    }
    return "";
  }, [loading, query, results.length]);

  return (
    <div className="search-page">
      <header className="header">
        <div className="brand-title">RECEPTION</div>
        <button className="logout-link" onClick={() => void handleLogout()}>
          ログアウト
        </button>
      </header>

      <div className="stats">チェックイン済み: {stats.checkedIn}名 / 全{stats.total}名</div>

      <div className="search-bar-wrap">
        <input
          ref={inputRef}
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="お名前を入力してください / Please enter your name"
        />
        {query && (
          <button className="clear-button" onClick={() => setQuery("")}>
            ✕
          </button>
        )}
      </div>

      {loading && <p className="muted">検索中...</p>}
      {message && <p className="error-text">{message}</p>}
      {noResultMessage && <p className="muted">{noResultMessage}</p>}

      <section className="results">
        {results.map((customer) => (
          <CustomerCard key={customer.row} customer={customer} onCheckIn={openCheckinModal} />
        ))}
      </section>

      <CheckinModal
        open={Boolean(selectedCustomer)}
        customerName={selectedCustomer?.氏名 ?? ""}
        loading={checkinLoading}
        onCancel={() => setSelectedCustomer(null)}
        onConfirm={() => void confirmCheckin()}
      />
    </div>
  );
}

export default SearchPage;
