// =========================
// 設定・辞書の読み込み
// =========================
const config = window.COSME_SLOT_CONFIG;
const i18n = window.COSME_SLOT_I18N || {};
const LANGS = ["ja", "en", "zh", "ko"];

if (!config || !i18n.ja) {
  alert("設定または言語ファイルの読み込みに失敗しました。");
}

// =========================
// ストレージキー
// =========================
const STORE_PREFIX = "cosme_slot_";
const KEYS = {
  settings: STORE_PREFIX + "settings",
  logs: STORE_PREFIX + "logs",
  lang: STORE_PREFIX + "lang"
};

// =========================
// アプリ状態
// =========================
const state = {
  lang: loadLang(),
  settings: loadSettings(),
  logs: loadLogs(),
  isSpinning: false,
  reelTimers: [],
  lastResult: null,
  imageLoadedMap: {}
};

// =========================
// DOM参照
// =========================
const dom = {
  root: document.documentElement,
  gameScreen: document.getElementById("gameScreen"),
  adminScreen: document.getElementById("adminScreen"),
  reels: Array.from(document.querySelectorAll(".reel")),
  startBtn: document.getElementById("startBtn"),
  soldOutBanner: document.getElementById("soldOutBanner"),
  playHint: document.getElementById("playHint"),
  brandTitle: document.getElementById("brandTitle"),
  inlineResultLayer: document.getElementById("inlineResultLayer"),
  inlineResultRank: document.getElementById("inlineResultRank"),
  inlineResultImage: document.getElementById("inlineResultImage"),
  inlineResultCloseBtn: document.getElementById("inlineResultCloseBtn"),
  inlineConfettiCanvas: document.getElementById("inlineConfettiCanvas"),
  inlineFlashLayer: document.getElementById("inlineFlashLayer"),
  showcaseWideImg: document.getElementById("showcaseWideImg"),
  langSwitchBtn: document.getElementById("langSwitchBtn"),
  footerNote: document.getElementById("footerNote"),
  openAdminBtn: document.getElementById("openAdminBtn"),
  slotTouchArea: document.getElementById("slotTouchArea"),
  adminLock: document.getElementById("adminLock"),
  adminContent: document.getElementById("adminContent"),
  pinInput: document.getElementById("pinInput"),
  pinUnlockBtn: document.getElementById("pinUnlockBtn"),
  pinBackBtn: document.getElementById("pinBackBtn"),
  adminTitle: document.getElementById("adminTitle"),
  summaryTitle: document.getElementById("summaryTitle"),
  labelTotalPlay: document.getElementById("labelTotalPlay"),
  labelTotalWin: document.getElementById("labelTotalWin"),
  labelTotalLose: document.getElementById("labelTotalLose"),
  labelStockLeft: document.getElementById("labelStockLeft"),
  totalPlayValue: document.getElementById("totalPlayValue"),
  totalWinValue: document.getElementById("totalWinValue"),
  totalLoseValue: document.getElementById("totalLoseValue"),
  stockLeftValue: document.getElementById("stockLeftValue"),
  rankTableTitle: document.getElementById("rankTableTitle"),
  thRank: document.getElementById("thRank"),
  thWinCount: document.getElementById("thWinCount"),
  thStock: document.getElementById("thStock"),
  thProbability: document.getElementById("thProbability"),
  rankTableBody: document.getElementById("rankTableBody"),
  hourlyTitle: document.getElementById("hourlyTitle"),
  thHour: document.getElementById("thHour"),
  thHourCount: document.getElementById("thHourCount"),
  hourlyTableBody: document.getElementById("hourlyTableBody"),
  settingTitle: document.getElementById("settingTitle"),
  labelThemeColor: document.getElementById("labelThemeColor"),
  labelBackgroundColor: document.getElementById("labelBackgroundColor"),
  labelAccentColor: document.getElementById("labelAccentColor"),
  labelBrandName: document.getElementById("labelBrandName"),
  labelReelSymbols: document.getElementById("labelReelSymbols"),
  themeColorInput: document.getElementById("themeColorInput"),
  bgColorInput: document.getElementById("bgColorInput"),
  accentColorInput: document.getElementById("accentColorInput"),
  brandNameInput: document.getElementById("brandNameInput"),
  reelSymbolsInput: document.getElementById("reelSymbolsInput"),
  prizeEditorWrap: document.getElementById("prizeEditorWrap"),
  addPrizeBtn: document.getElementById("addPrizeBtn"),
  saveSettingBtn: document.getElementById("saveSettingBtn"),
  dataActionTitle: document.getElementById("dataActionTitle"),
  downloadCsvBtn: document.getElementById("downloadCsvBtn"),
  resetDataBtn: document.getElementById("resetDataBtn"),
  closeAdminBtn: document.getElementById("closeAdminBtn"),
  pinTitle: document.getElementById("pinTitle")
};

// =========================
// 初期化
// =========================
applyTheme();
applyTexts();
attachEvents();
preloadSymbolImages();
applyShowcaseImages();
renderReels(state.settings.reelSymbols.slice(0, 3));
updateSoldOutStatus();

// =========================
// ストレージ入出力
// =========================
function loadSettings() {
  const saved = localStorage.getItem(KEYS.settings);
  if (!saved) return deepClone(config);
  try {
    const parsed = JSON.parse(saved);
    return normalizeSettings(parsed);
  } catch (_err) {
    return deepClone(config);
  }
}

function saveSettings() {
  localStorage.setItem(KEYS.settings, JSON.stringify(state.settings));
}

function loadLogs() {
  const saved = localStorage.getItem(KEYS.logs);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function saveLogs() {
  localStorage.setItem(KEYS.logs, JSON.stringify(state.logs));
}

function loadLang() {
  const saved = localStorage.getItem(KEYS.lang);
  if (LANGS.includes(saved)) return saved;
  return "ja";
}

function saveLang() {
  localStorage.setItem(KEYS.lang, state.lang);
}

// =========================
// ユーティリティ
// =========================
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function t(key) {
  return (i18n[state.lang] && i18n[state.lang][key]) || i18n.ja[key] || key;
}

function normalizeSettings(raw) {
  const next = deepClone(config);
  const symbolKeys = Object.keys(next.symbolAssets || {});

  function mapSymbolToken(token) {
    const str = String(token || "").trim();
    if (!str) return "";
    if (symbolKeys.includes(str)) return str;
    for (let i = 0; i < symbolKeys.length; i += 1) {
      const key = symbolKeys[i];
      const fallback = next.symbolAssets[key] && next.symbolAssets[key].fallback;
      if (str === fallback) return key;
    }
    return str;
  }

  if (typeof raw.themeColor === "string") next.themeColor = raw.themeColor;
  if (typeof raw.backgroundColor === "string") next.backgroundColor = raw.backgroundColor;
  if (typeof raw.accentColor === "string") next.accentColor = raw.accentColor;
  if (typeof raw.brandName === "string" && raw.brandName.trim()) next.brandName = raw.brandName.trim();
  if (typeof raw.adminPin === "string" && /^\d{4}$/.test(raw.adminPin)) next.adminPin = raw.adminPin;
  if (typeof raw.showcaseImage === "string" && raw.showcaseImage.trim()) {
    next.showcaseImage = raw.showcaseImage.trim();
  } else if (Array.isArray(raw.showcaseImages)) {
    // 旧設定互換: 配列の先頭を単一画像として採用
    const legacyFirst = raw.showcaseImages.map((v) => String(v || "").trim()).filter(Boolean)[0];
    if (legacyFirst) next.showcaseImage = legacyFirst;
  }
  if (Array.isArray(raw.reelSymbols) && raw.reelSymbols.length > 0) {
    next.reelSymbols = raw.reelSymbols.map(mapSymbolToken).filter(Boolean);
  }
  if (Array.isArray(raw.prizes)) {
    const normalizedPrizes = raw.prizes.map((p, idx) => ({
      id: String(p.id || ("prize_" + idx)),
      name: {
        ja: String(p.name && p.name.ja ? p.name.ja : ("ランク" + (idx + 1))),
        en: String(p.name && p.name.en ? p.name.en : ("Prize " + (idx + 1))),
        zh: String(p.name && p.name.zh ? p.name.zh : ("奖项" + (idx + 1))),
        ko: String(p.name && p.name.ko ? p.name.ko : ("등급 " + (idx + 1)))
      },
      symbols: Array.isArray(p.symbols) ? p.symbols.slice(0, 3).map(mapSymbolToken) : ["sparkle", "sparkle", "sparkle"],
      probability: Number(p.probability) || 0,
      stock: toInt(p.stock, 0),
      image: typeof p.image === "string" ? p.image : ""
    })).filter((p) => p.symbols.length === 3);
    if (normalizedPrizes.length > 0) next.prizes = normalizedPrizes;
  }

  // 旧データが絵文字のみなどで崩れた場合は最新configへフォールバック
  if (!next.reelSymbols.some((v) => symbolKeys.includes(v))) {
    next.reelSymbols = deepClone(config.reelSymbols);
  }
  return next;
}

function toInt(value, fallback) {
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  return n;
}

function getSymbolAsset(symbolKey) {
  const assets = state.settings.symbolAssets || {};
  const item = assets[symbolKey];
  if (item && typeof item === "object") return item;
  return { src: "", fallback: symbolKey || "✨" };
}

function renderSymbolIntoElement(el, symbolKey) {
  const asset = getSymbolAsset(symbolKey);
  if (asset.src) {
    el.textContent = asset.fallback || symbolKey || "✨";
    const img = document.createElement("img");
    img.className = "symbol-img";
    img.alt = symbolKey;
    img.src = asset.src;
    img.onload = function onImageLoad() {
      el.innerHTML = "";
      el.appendChild(img);
    };
    img.onerror = function onImageError() {
      el.textContent = asset.fallback || symbolKey || "✨";
    };
    if (state.imageLoadedMap[asset.src]) {
      el.innerHTML = "";
      el.appendChild(img);
    }
    return;
  }
  el.textContent = asset.fallback || symbolKey || "✨";
}

function preloadSymbolImages() {
  const assets = state.settings.symbolAssets || {};
  Object.keys(assets).forEach((key) => {
    const src = assets[key] && assets[key].src;
    if (!src) return;
    const img = new Image();
    img.onload = function onLoad() {
      state.imageLoadedMap[src] = true;
    };
    img.onerror = function onError() {
      state.imageLoadedMap[src] = false;
    };
    img.src = src;
  });

  const showcaseSrc = typeof state.settings.showcaseImage === "string" ? state.settings.showcaseImage : "";
  if (showcaseSrc) {
    const img = new Image();
    img.onload = function onLoad() {
      state.imageLoadedMap[showcaseSrc] = true;
    };
    img.onerror = function onError() {
      state.imageLoadedMap[showcaseSrc] = false;
    };
    img.src = showcaseSrc;
  }
}

function buildReelSpinCell(symbolKey, cellHeight) {
  const cell = document.createElement("div");
  cell.className = "reel-cell";
  cell.style.height = cellHeight + "px";
  renderSymbolIntoElement(cell, symbolKey);
  return cell;
}

function isSoldOut() {
  return state.settings.prizes.every((p) => p.stock <= 0);
}

function applyTheme() {
  dom.root.style.setProperty("--theme", state.settings.themeColor);
  dom.root.style.setProperty("--bg", state.settings.backgroundColor);
  dom.root.style.setProperty("--accent", state.settings.accentColor);
  dom.brandTitle.textContent = state.settings.brandName;
  document.body.style.background = "linear-gradient(180deg, #fdfbf8 0%, " + state.settings.backgroundColor + " 55%, #efebe4 100%)";
  applyShowcaseImages();
}

function applyShowcaseImages() {
  const assets = state.settings.symbolAssets || {};
  const fallbackFirst = Object.keys(assets)
    .map((k) => assets[k] && assets[k].src)
    .filter(Boolean)
    [0];
  const defaultShowcase = (typeof config.showcaseImage === "string" && config.showcaseImage.trim())
    ? config.showcaseImage.trim()
    : "";
  const src = (typeof state.settings.showcaseImage === "string" && state.settings.showcaseImage.trim())
    ? state.settings.showcaseImage.trim()
    : fallbackFirst;
  const imgEl = dom.showcaseWideImg;
  if (!imgEl) return;
  if (src) {
    imgEl.src = src;
    imgEl.style.display = "block";
    imgEl.onload = function onShowcaseLoad() {
      imgEl.style.display = "block";
    };
    imgEl.onerror = function onShowcaseError() {
      if (defaultShowcase && src !== defaultShowcase) {
        imgEl.src = defaultShowcase;
        return;
      }
      imgEl.style.display = "none";
    };
  } else {
    imgEl.removeAttribute("src");
    imgEl.style.display = "none";
  }
}

function applyTexts() {
  dom.startBtn.textContent = t("start");
  dom.playHint.textContent = t("swipeHint");
  dom.soldOutBanner.textContent = t("soldOut");
  dom.openAdminBtn.textContent = t("admin");
  dom.inlineResultCloseBtn.textContent = t("back");
  dom.footerNote.textContent = t("footer");
  dom.langSwitchBtn.textContent = state.lang.toUpperCase();
  dom.pinTitle.textContent = t("enterPin");
  dom.pinUnlockBtn.textContent = t("unlock");
  dom.pinBackBtn.textContent = t("back");
  dom.adminTitle.textContent = t("admin");
  dom.summaryTitle.textContent = t("summary");
  dom.labelTotalPlay.textContent = t("totalPlay");
  dom.labelTotalWin.textContent = t("totalWin");
  dom.labelTotalLose.textContent = t("totalLose");
  dom.labelStockLeft.textContent = t("stockLeft");
  dom.rankTableTitle.textContent = t("rankTable");
  dom.thRank.textContent = t("rank");
  dom.thWinCount.textContent = t("winCount");
  dom.thStock.textContent = t("stock");
  dom.thProbability.textContent = t("probability");
  dom.hourlyTitle.textContent = t("hourly");
  dom.thHour.textContent = t("hour");
  dom.thHourCount.textContent = t("playCount");
  dom.settingTitle.textContent = t("settings");
  dom.labelThemeColor.textContent = t("themeColor");
  dom.labelBackgroundColor.textContent = t("backgroundColor");
  dom.labelAccentColor.textContent = t("accentColor");
  dom.labelBrandName.textContent = t("brandName");
  dom.labelReelSymbols.textContent = t("reelSymbols");
  dom.addPrizeBtn.textContent = t("addPrize");
  dom.saveSettingBtn.textContent = t("save");
  dom.dataActionTitle.textContent = t("actions");
  dom.downloadCsvBtn.textContent = t("downloadCsv");
  dom.resetDataBtn.textContent = t("resetData");
  dom.closeAdminBtn.textContent = t("close");
}

function showScreen(screenName) {
  dom.gameScreen.classList.add("hidden");
  dom.adminScreen.classList.add("hidden");
  if (screenName === "game") dom.gameScreen.classList.remove("hidden");
  if (screenName === "admin") dom.adminScreen.classList.remove("hidden");
}

function renderReels(symbols) {
  dom.reels.forEach((reel, idx) => {
    renderSymbolIntoElement(reel, symbols[idx] || "sparkle");
  });
}

function updateSoldOutStatus() {
  const soldout = isSoldOut();
  dom.soldOutBanner.classList.toggle("hidden", !soldout);
  dom.startBtn.disabled = soldout || state.isSpinning;
  dom.startBtn.style.opacity = (soldout || state.isSpinning) ? "0.5" : "1";
}

// =========================
// スロット判定ロジック
// =========================
function drawPrize() {
  const available = state.settings.prizes.filter((p) => p.stock > 0 && p.probability > 0);
  const totalProb = available.reduce((sum, p) => sum + Number(p.probability), 0);
  const rand = Math.random() * 100;
  if (available.length === 0 || rand > totalProb) {
    return { type: "lose", symbols: makeLoseSymbols() };
  }
  let cursor = 0;
  for (let i = 0; i < available.length; i += 1) {
    cursor += Number(available[i].probability);
    if (rand <= cursor) {
      return { type: "win", prizeId: available[i].id, symbols: available[i].symbols.slice(0, 3) };
    }
  }
  return { type: "lose", symbols: makeLoseSymbols() };
}

function makeLoseSymbols() {
  const symbols = state.settings.reelSymbols;
  const prizePatterns = state.settings.prizes.map((p) => p.symbols.join("|"));
  for (let tries = 0; tries < 100; tries += 1) {
    const candidate = [pick(symbols), pick(symbols), pick(symbols)];
    if (!prizePatterns.includes(candidate.join("|"))) return candidate;
  }
  return [pick(symbols), pick(symbols), pick(symbols)];
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)] || "sparkle";
}

function getPrizeById(id) {
  return state.settings.prizes.find((p) => p.id === id) || null;
}

function getPrizeName(prize) {
  return (prize && prize.name && prize.name[state.lang]) || (prize && prize.name && prize.name.ja) || "";
}

// =========================
// スピン演出
// =========================
function startSpin() {
  if (state.isSpinning || isSoldOut()) return;
  animateLever();
  state.isSpinning = true;
  updateSoldOutStatus();
  const result = drawPrize();
  state.lastResult = result;
  const spinPromises = dom.reels.map((reel, idx) => spinOneReel(reel, result.symbols[idx], idx));
  Promise.all(spinPromises).then(() => {
    setTimeout(() => finishSpin(result), 1000);
  });
}

function animateLever() {
  dom.slotTouchArea.classList.remove("lever-pull");
  void dom.slotTouchArea.offsetWidth;
  dom.slotTouchArea.classList.add("lever-pull");
  setTimeout(() => {
    dom.slotTouchArea.classList.remove("lever-pull");
  }, 420);
}

function spinOneReel(reelEl, finalSymbol, reelIndex) {
  return new Promise((resolve) => {
    reelEl.classList.add("spinning");
    const cellHeight = Math.round(reelEl.getBoundingClientRect().height) || 140;
    reelEl.style.height = cellHeight + "px";
    const strip = document.createElement("div");
    strip.className = "reel-strip";

    const cells = [];
    const totalCells = 20 + reelIndex * 4;
    // 終点シンボルを先頭に置き、下方向へ流して停止させる
    cells.push(finalSymbol);
    for (let i = 1; i < totalCells; i += 1) {
      cells.push(pick(state.settings.reelSymbols));
    }

    cells.forEach((symbolKey) => {
      strip.appendChild(buildReelSpinCell(symbolKey, cellHeight));
    });

    reelEl.innerHTML = "";
    reelEl.appendChild(strip);

    const distance = (cells.length - 1) * cellHeight;
    const duration = 1500 + reelIndex * 550;
    strip.style.transform = "translateY(-" + distance + "px)";

    let done = false;
    let rafId = null;

    function easing(progress) {
      if (progress <= 0) return 0;
      if (progress >= 1) return 1;
      // 前半で勢いよく流し、後半で減速して停止する
      if (progress < 0.72) {
        return (progress / 0.72) * 0.86;
      }
      const tail = (progress - 0.72) / 0.28;
      return 0.86 + (1 - Math.pow(1 - tail, 3)) * 0.14;
    }

    function cleanup() {
      if (done) return;
      done = true;
      if (rafId) cancelAnimationFrame(rafId);
      reelEl.classList.remove("spinning");
      reelEl.style.height = "";

      // 停止瞬間のちらつきを避けるため、見えている最終セルをそのまま固定
      const finalCell = strip.firstElementChild ? strip.firstElementChild.cloneNode(true) : null;
      reelEl.innerHTML = "";
      if (finalCell) {
        finalCell.style.height = "100%";
        reelEl.appendChild(finalCell);
      } else {
        renderSymbolIntoElement(reelEl, finalSymbol);
      }
      resolve();
    }

    const startAt = performance.now();
    function tick(now) {
      const elapsed = now - startAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = easing(progress);
      // 下方向へ回して 0 に着地させる
      strip.style.transform = "translateY(-" + (distance * (1 - eased)) + "px)";
      if (progress >= 1) {
        cleanup();
        return;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  });
}

function finishSpin(result) {
  if (result.type === "win") {
    const target = getPrizeById(result.prizeId);
    if (target && target.stock > 0) target.stock -= 1;
  }
  recordPlay(result);
  saveSettings();
  saveLogs();
  updateSoldOutStatus();
  showResult(result);
  state.isSpinning = false;
  updateSoldOutStatus();
}

// =========================
// 結果画面演出
// =========================
function showResult(result) {
  if (result.type === "win") {
    dom.inlineResultImage.classList.remove("hidden");
    const prize = getPrizeById(result.prizeId);
    const rankName = getPrizeName(prize);
    dom.inlineResultRank.textContent = rankName;
    if (prize && prize.image) {
      dom.inlineResultImage.innerHTML = '<img alt="' + escapeHtml(rankName) + '" src="' + escapeHtml(prize.image) + '">';
    } else {
      dom.inlineResultImage.innerHTML = "";
      const marker = document.createElement("div");
      marker.className = "result-symbol";
      renderSymbolIntoElement(marker, (prize && prize.symbols && prize.symbols[0]) || "sparkle");
      dom.inlineResultImage.appendChild(marker);
    }
    playFlash(dom.inlineFlashLayer);
    runConfetti(dom.inlineConfettiCanvas, 2200);
  } else {
    dom.inlineResultRank.textContent = t("lose");
    dom.inlineResultImage.innerHTML = "";
    dom.inlineResultImage.classList.add("hidden");
  }
  dom.inlineResultLayer.classList.remove("hidden");
}

function playFlash(targetEl) {
  targetEl.classList.remove("animate");
  void targetEl.offsetWidth;
  targetEl.classList.add("animate");
}

function runConfetti(canvas, durationMs) {
  const box = canvas.parentElement.getBoundingClientRect();
  canvas.width = box.width;
  canvas.height = box.height;
  const ctx = canvas.getContext("2d");
  const pieces = [];
  for (let i = 0; i < 90; i += 1) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 5 + Math.random() * 8,
      h: 5 + Math.random() * 11,
      vy: 1.5 + Math.random() * 2.8,
      vx: -1.2 + Math.random() * 2.4,
      r: Math.random() * 360,
      vr: -5 + Math.random() * 10,
      c: [state.settings.themeColor, state.settings.accentColor, "#ffffff", "#ffcce3"][Math.floor(Math.random() * 4)]
    });
  }
  const start = performance.now();
  function draw(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (p.y > canvas.height + 20) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.r * Math.PI) / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (elapsed < durationMs) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(draw);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// =========================
// ログ記録と集計
// =========================
function recordPlay(result) {
  const entry = {
    timestamp: new Date().toISOString(),
    result: result.type === "win" ? getPrizeName(getPrizeById(result.prizeId)) : "lose",
    resultId: result.type === "win" ? result.prizeId : "lose",
    language: state.lang
  };
  state.logs.push(entry);
}

function buildSummary() {
  const totalPlay = state.logs.length;
  const totalWin = state.logs.filter((l) => l.resultId !== "lose").length;
  const totalLose = totalPlay - totalWin;
  const stockLeft = state.settings.prizes.reduce((sum, p) => sum + Math.max(0, p.stock), 0);
  return { totalPlay, totalWin, totalLose, stockLeft };
}

function buildRankStats() {
  const counts = {};
  state.settings.prizes.forEach((p) => { counts[p.id] = 0; });
  state.logs.forEach((log) => {
    if (counts[log.resultId] !== undefined) counts[log.resultId] += 1;
  });
  return state.settings.prizes.map((p) => ({
    id: p.id,
    name: getPrizeName(p),
    wins: counts[p.id] || 0,
    stock: p.stock,
    probability: Number(p.probability) || 0
  }));
}

function buildHourlyStats() {
  const hours = Array(24).fill(0);
  state.logs.forEach((log) => {
    const d = new Date(log.timestamp);
    if (!Number.isNaN(d.getTime())) hours[d.getHours()] += 1;
  });
  return hours;
}

function renderAdminStats() {
  const summary = buildSummary();
  dom.totalPlayValue.textContent = String(summary.totalPlay);
  dom.totalWinValue.textContent = String(summary.totalWin);
  dom.totalLoseValue.textContent = String(summary.totalLose);
  dom.stockLeftValue.textContent = String(summary.stockLeft);

  const rankStats = buildRankStats();
  dom.rankTableBody.innerHTML = "";
  rankStats.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + escapeHtml(r.name) + "</td>" +
      "<td>" + r.wins + "</td>" +
      "<td>" + r.stock + "</td>" +
      "<td>" + r.probability + "</td>";
    dom.rankTableBody.appendChild(tr);
  });

  const hourly = buildHourlyStats();
  dom.hourlyTableBody.innerHTML = "";
  hourly.forEach((count, h) => {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + String(h).padStart(2, "0") + ":00</td><td>" + count + "</td>";
    dom.hourlyTableBody.appendChild(tr);
  });
}

function downloadCsv() {
  const header = ["日時", "結果", "使用言語"];
  const rows = state.logs.map((log) => [
    formatLocalDate(log.timestamp),
    log.resultId === "lose" ? t("lose") : (log.result || log.resultId),
    log.language
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cosme_slot_logs.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(v) {
  const text = String(v || "");
  if (/[",\n]/.test(text)) return "\"" + text.replace(/"/g, "\"\"") + "\"";
  return text;
}

function formatLocalDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return y + "-" + m + "-" + day + " " + hh + ":" + mm + ":" + ss;
}

// =========================
// 管理設定編集
// =========================
function openAdmin() {
  dom.adminLock.classList.remove("hidden");
  dom.adminContent.classList.add("hidden");
  dom.pinInput.value = "";
  showScreen("admin");
}

function unlockAdmin() {
  if (dom.pinInput.value !== state.settings.adminPin) {
    alert(t("pinError"));
    return;
  }
  dom.adminLock.classList.add("hidden");
  dom.adminContent.classList.remove("hidden");
  renderSettingsForm();
  renderAdminStats();
}

function renderSettingsForm() {
  dom.themeColorInput.value = state.settings.themeColor;
  dom.bgColorInput.value = state.settings.backgroundColor;
  dom.accentColorInput.value = state.settings.accentColor;
  dom.brandNameInput.value = state.settings.brandName;
  dom.reelSymbolsInput.value = state.settings.reelSymbols.join(", ");
  renderPrizeEditors(state.settings.prizes);
}

function renderPrizeEditors(prizes) {
  dom.prizeEditorWrap.innerHTML = "";
  prizes.forEach((p, idx) => {
    const box = document.createElement("div");
    box.className = "prize-row";
    box.innerHTML = [
      "<label class='label'>ID</label>",
      "<input data-field='id' data-idx='" + idx + "' value='" + escapeHtml(p.id) + "' />",
      "<label class='label'>Name(JA / EN / ZH / KO)</label>",
      "<input data-field='name_ja' data-idx='" + idx + "' value='" + escapeHtml(p.name.ja) + "' />",
      "<input data-field='name_en' data-idx='" + idx + "' value='" + escapeHtml(p.name.en) + "' />",
      "<input data-field='name_zh' data-idx='" + idx + "' value='" + escapeHtml(p.name.zh) + "' />",
      "<input data-field='name_ko' data-idx='" + idx + "' value='" + escapeHtml(p.name.ko) + "' />",
      "<label class='label'>Symbols (3, comma separated)</label>",
      "<input data-field='symbols' data-idx='" + idx + "' value='" + escapeHtml(p.symbols.join(", ")) + "' />",
      "<label class='label'>" + t("probability") + "</label>",
      "<input data-field='probability' data-idx='" + idx + "' type='number' min='0' max='100' step='0.1' value='" + p.probability + "' />",
      "<label class='label'>" + t("stock") + "</label>",
      "<input data-field='stock' data-idx='" + idx + "' type='number' min='0' step='1' value='" + p.stock + "' />",
      "<label class='label'>Image Path</label>",
      "<input data-field='image' data-idx='" + idx + "' value='" + escapeHtml(p.image || "") + "' />",
      "<button class='remove-btn' data-remove='" + idx + "' type='button'>Remove</button>"
    ].join("");
    dom.prizeEditorWrap.appendChild(box);
  });
  Array.from(dom.prizeEditorWrap.querySelectorAll("[data-remove]")).forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-remove"));
      const next = state.settings.prizes.slice();
      next.splice(idx, 1);
      if (next.length === 0) return;
      state.settings.prizes = next;
      renderPrizeEditors(state.settings.prizes);
    });
  });
}

function collectSettingsFromForm() {
  const next = deepClone(state.settings);
  next.themeColor = dom.themeColorInput.value;
  next.backgroundColor = dom.bgColorInput.value;
  next.accentColor = dom.accentColorInput.value;
  next.brandName = dom.brandNameInput.value.trim() || config.brandName;
  next.reelSymbols = dom.reelSymbolsInput.value.split(",").map((s) => s.trim()).filter(Boolean);

  const map = {};
  Array.from(dom.prizeEditorWrap.querySelectorAll("[data-field]")).forEach((el) => {
    const idx = Number(el.getAttribute("data-idx"));
    const field = el.getAttribute("data-field");
    map[idx] = map[idx] || {};
    map[idx][field] = el.value;
  });

  next.prizes = Object.keys(map).sort((a, b) => Number(a) - Number(b)).map((k) => {
    const row = map[k];
    return {
      id: (row.id || "").trim() || ("prize_" + k),
      name: {
        ja: (row.name_ja || "").trim() || "ランク",
        en: (row.name_en || "").trim() || "Prize",
        zh: (row.name_zh || "").trim() || "奖项",
        ko: (row.name_ko || "").trim() || "등급"
      },
      symbols: (row.symbols || "").split(",").map((s) => s.trim()).filter(Boolean),
      probability: Number(row.probability || 0),
      stock: toInt(row.stock, -1),
      image: (row.image || "").trim()
    };
  });
  return next;
}

function validateSettings(next) {
  if (!Array.isArray(next.prizes) || next.prizes.length === 0) return false;
  const totalProb = next.prizes.reduce((sum, p) => sum + Number(p.probability || 0), 0);
  if (totalProb > 100.0000001) {
    alert(t("badProbability"));
    return false;
  }
  for (let i = 0; i < next.prizes.length; i += 1) {
    const p = next.prizes[i];
    if (!Array.isArray(p.symbols) || p.symbols.length !== 3) {
      alert(t("badSymbol"));
      return false;
    }
    if (!Number.isInteger(p.stock) || p.stock < 0) {
      alert(t("badStock"));
      return false;
    }
  }
  if (!Array.isArray(next.reelSymbols) || next.reelSymbols.length === 0) {
    next.reelSymbols = deepClone(config.reelSymbols);
  }
  return true;
}

function saveSettingsFromAdmin() {
  try {
    const next = collectSettingsFromForm();
    if (!validateSettings(next)) return;
    state.settings = normalizeSettings(next);
    saveSettings();
    preloadSymbolImages();
    applyTheme();
    applyTexts();
    updateSoldOutStatus();
    renderAdminStats();
    alert(t("saveOk"));
  } catch (_err) {
    alert(t("saveNg"));
  }
}

function addPrizeEditor() {
  const idx = state.settings.prizes.length + 1;
  state.settings.prizes.push({
    id: "new_" + Date.now(),
    name: { ja: "ランク" + idx, en: "Prize " + idx, zh: "奖项" + idx, ko: "등급 " + idx },
    symbols: ["✨", "✨", "✨"],
    probability: 0,
    stock: 0,
    image: ""
  });
  renderPrizeEditors(state.settings.prizes);
}

function resetData() {
  if (!confirm(t("resetConfirm"))) return;
  localStorage.removeItem(KEYS.settings);
  localStorage.removeItem(KEYS.logs);
  state.settings = deepClone(config);
  state.logs = [];
  applyTheme();
  applyTexts();
  renderReels(state.settings.reelSymbols.slice(0, 3));
  renderSettingsForm();
  renderAdminStats();
  updateSoldOutStatus();
  alert(t("resetDone"));
}

// =========================
// イベント登録
// =========================
function attachEvents() {
  dom.startBtn.addEventListener("click", startSpin);
  dom.inlineResultCloseBtn.addEventListener("click", () => {
    dom.inlineResultLayer.classList.add("hidden");
  });
  dom.openAdminBtn.addEventListener("click", openAdmin);
  dom.pinUnlockBtn.addEventListener("click", unlockAdmin);
  dom.pinBackBtn.addEventListener("click", () => showScreen("game"));
  dom.closeAdminBtn.addEventListener("click", () => showScreen("game"));
  dom.saveSettingBtn.addEventListener("click", saveSettingsFromAdmin);
  dom.addPrizeBtn.addEventListener("click", addPrizeEditor);
  dom.downloadCsvBtn.addEventListener("click", downloadCsv);
  dom.resetDataBtn.addEventListener("click", resetData);

  dom.pinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") unlockAdmin();
  });

  dom.langSwitchBtn.addEventListener("click", () => {
    const idx = LANGS.indexOf(state.lang);
    state.lang = LANGS[(idx + 1) % LANGS.length];
    saveLang();
    applyTexts();
    if (!dom.adminContent.classList.contains("hidden")) {
      renderSettingsForm();
      renderAdminStats();
    }
  });

  let touchStartY = null;
  dom.slotTouchArea.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });
  dom.slotTouchArea.addEventListener("touchend", (e) => {
    if (touchStartY == null || !e.changedTouches || e.changedTouches.length === 0) return;
    const delta = touchStartY - e.changedTouches[0].clientY;
    touchStartY = null;
    if (delta > 40) startSpin();
  }, { passive: true });
}
