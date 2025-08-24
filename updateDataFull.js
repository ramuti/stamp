/* ============================
   updateDataFull.js — 管理者用追加データ（フル版）
   ============================ */
(function() {
  const newCards = [
  {
    "id": "c1756035677590",
    "name": "カード",
    "slots": 5,
    "addPass": "追加",
    "bg": "#fff0f5",
    "stampIcon": "",
    "notifyMsg": "",
    "maxNotifyMsg": ""
  }
];
  const newKeywords = [];
  const newUpdates = [];

  function loadJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){return fallback;}
  }
  function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

  let cards = loadJSON("cards", []);
  newCards.forEach(nc => { if (!cards.some(c => c.id === nc.id)) cards.push(nc); });
  saveJSON("cards", cards);

  let keywords = loadJSON("keywords", []);
  newKeywords.forEach(nk => { if (!keywords.some(k => k.cardId === nk.cardId && k.word === nk.word)) keywords.push(nk); });
  saveJSON("keywords", keywords);

  let updates = loadJSON("updates", []);
  newUpdates.forEach(nu => updates.push(nu));
  saveJSON("updates", updates);

  console.log("管理者追加データ（フル版）を適用しました");
})();