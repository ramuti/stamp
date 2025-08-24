/* ============================
   generateUpdateData.js — 管理者用データ生成（完全版）
   - script.js の下に読み込む
   - カード・合言葉・更新履歴を文字列化してコピー
   ============================ */

function generateUpdateData() {
  // 現在の cards / keywords / updates をまとめて文字列化
  const newCards = cards.map(c => ({
    id: c.id,
    name: c.name,
    slots: c.slots,
    addPass: c.addPass,
    bg: c.bg,
    stampIcon: c.stampIcon,
    notifyMsg: c.notifyMsg,
    maxNotifyMsg: c.maxNotifyMsg
  }));

  const newKeywords = keywords.map(k => ({
    cardId: k.cardId,
    word: k.word,
    enabled: k.enabled
  }));

  const newUpdates = updates.map(u => ({
    date: u.date,
    msg: u.msg
  }));

  // 文字列化して return
  return `/* ============================
   updateDataFull.js — 管理者用追加データ（フル版）
   ============================ */
(function() {
  const newCards = ${JSON.stringify(newCards, null, 2)};
  const newKeywords = ${JSON.stringify(newKeywords, null, 2)};
  const newUpdates = ${JSON.stringify(newUpdates, null, 2)};

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
})();`;
}