export const frontendDemo = {
  brandName: "KIMEKO HAIR（示範）",
  themeColor: "#d9bf77",
  hero: {
    heading:
      "中壢接髮推薦 KIMEKO HAIR\n極致零感羽毛接髮｜新縮毛鏡面燙｜歐美手刷染\n日韓系光線染｜5G 網狀纖維護髮｜特殊色白金髮",
  },
  promos: [] as { id: string; image?: string; caption?: string }[],
  services: [
    {
      id: "feather-extension",
      title: "1. 極致零感羽毛接髮 🪶",
      description: "一種超輕量、超隱形的接髮技術，強調「零感」佩戴，像羽毛一樣輕盈柔順。",
      features: [
        "小接點設計，接合處幾乎隱形",
        "適合細軟髮、髮量少，增量不增負擔",
        "可自然擺動，洗髮梳理都方便",
      ],
      suitableFor: ["希望接髮後仍維持自然輕盈感的人", "容易因接髮重量頭皮不適的人"],
    },
  ],
  otherServices: [
    {
      id: "mirror-perm",
      title: "1. 新縮毛鏡面燙 🔥",
      description: "升級版縮毛矯正，讓頭髮達到超順直 + 高光澤，像鏡面一樣反光。",
      features: ["比傳統縮毛矯正更溫和", "光澤感 UP，柔順亮麗"],
      suitableFor: ["自然捲、毛躁髮想要柔順光澤的人"],
    },
    {
      id: "balayage",
      title: "2. 歐美手刷染 🎨",
      description: "來自歐美的 Balayage 手刷染，不使用鋁箔，創造自然漸層與光影。",
      features: ["自然漸層，不會一塊一塊", "維護簡單，布丁頭不明顯"],
      suitableFor: ["想要層次感、不喜歡單一髮色的人"],
    },
  ],
  videos: [] as { id: string; video: string }[],
  environment: [] as { id: string; image: string }[],
  installment: [
    "【zingala 銀角零卡】先享受、後付款，不需要任何信用卡。",
    "分期可分 3/6/9 期，美麗無壓力，先享受下個月再付款。",
    "申請條件：1. 年滿 18 歲 2. 需有工作收入 3. 信用正常。",
  ],
  contact: {
    address: "桃園市中壢區中平路106號2樓",
    mapUrl: "https://maps.app.goo.gl/nRbRwUan3vsPeUmT8",
    phone: "0938-323-506",
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/kimeko0905",
    line: "https://lin.ee/Urb3nYc",
  },
};
