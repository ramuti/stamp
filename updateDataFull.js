/* ============================
   updateDataFull.js — 管理者追加データ（フル版）
   - 更新履歴は管理者が手動で追加
   ============================ */

(function() {
  // --- 新しいカード一覧 ---
  const newCards = [
    {id:"c20001", name:"夏祭りカード", slots:5, addPass:"natsu2025", bg:"#ffefd5", stampIcon:"🎆", notifyMsg:"夏祭りスタンプを集めよう！", maxNotifyMsg:"通知上限"},
    {id:"c20002", name:"秋の読書カード", slots:4, addPass:"aki2025", bg:"#f5deb3", stampIcon:"📚", notifyMsg:"読書スタンプを集めよう！", maxNotifyMsg:"通知上限"},
    {id:"c20003", name:"冬のイルミカード", slots:6, addPass:"fuyu2025", bg:"#e0f7fa", stampIcon:"❄️", notifyMsg:"イルミネーションスタンプを集めよう！", maxNotifyMsg:"通知上限"}
  ];

  // --- 合言葉一覧 ---
  const newKeywords = [
    {cardId:"c20001", word:"花火", enabled:true},
    {cardId:"c20001", word:"屋台", enabled:true},
    {cardId:"c20001", word:"金魚", enabled:true},

    {cardId:"c20002", word:"読書", enabled:true},
    {cardId:"c20002", word:"本棚", enabled:true},
    {cardId:"c20002", word:"図書館", enabled:true},

    {cardId:"c20003", word:"イルミ", enabled:true},
    {cardId:"c20003", word:"ライトアップ", enabled:true},
    {cardId:"c20003", word:"雪", enabled:true}
  ];

  /* ========== localStorage 反映処理 ========== */
  function loadJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){return fallback;}
  }
  function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

  // カード追加（重複は除外）
  let cards = loadJSON("cards", []);
  newCards.forEach(nc => {
    if (!cards.some(c => c.id === nc.id)) cards.push(nc);
  });
  saveJSON("cards", cards);

  // 合言葉追加（重複は除外）
  let keywords = loadJSON("keywords", []);
  newKeywords.forEach(nk => {
    if (!keywords.some(k => k.cardId === nk.cardId && k.word === nk.word)) keywords.push(nk);
  });
  saveJSON("keywords", keywords);

  console.log("管理者追加データ（フル版）を適用しました");
})();