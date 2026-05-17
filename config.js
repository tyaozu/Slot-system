// カスタマイズ設定（ノーコード変更用）
window.COSME_SLOT_CONFIG = {
  // Givenchy系を意識したニュートラル配色
  themeColor: "#111111",
  backgroundColor: "#F6F3EE",
  accentColor: "#B59A5A",
  brandName: "GIVENCHY BEAUTY EVENT",
  adminPin: "1234",
  // シンボルアセット定義:
  // src にPNGパスを入れると画像表示、空ならfallback(絵文字/文字)表示
  symbolAssets: {
    lipstick: { src: "./assets/1.png", fallback: "💄" },
    blossom: { src: "./assets/2.png", fallback: "🌸" },
    sparkle: { src: "./assets/3.png", fallback: "✨" },
    lips: { src: "./assets/4.png", fallback: "👄" },
    kiss: { src: "./assets/5.png", fallback: "💋" },
    star: { src: "./assets/6.png", fallback: "⭐" }
  },
  // 下部ショーウィンドウ専用画像（横長1枚）
  showcaseImage: "./assets/7.png",
  prizes: [
    {
      id: "grand",
      name: { ja: "大当たり", en: "Grand Prize", zh: "大奖", ko: "대상" },
      symbols: ["lipstick", "lipstick", "lipstick"],
      probability: 5,
      stock: 10,
      image: ""
    },
    {
      id: "small",
      name: { ja: "小当たり", en: "Small Prize", zh: "小奖", ko: "소상" },
      symbols: ["blossom", "blossom", "blossom"],
      probability: 20,
      stock: 30,
      image: ""
    }
  ],
  // リールはsymbolAssetsのキーを使用
  reelSymbols: ["lipstick", "blossom", "sparkle", "lips", "kiss", "star"]
};
