/* ============================
   generateUpdateData.js — 管理者用コピー機能
   - updateDataFull.js の内容をコピー
   - script.js の下に読み込む
   ============================ */

(function(){
  // --- コピー用ボタンを作成 ---
  const btn = document.createElement("button");
  btn.textContent = "管理者用データコピー";
  btn.style.position = "fixed";
  btn.style.bottom = "10px";
  btn.style.right = "10px";
  btn.style.zIndex = 9999;
  btn.style.padding = "6px 12px";
  btn.style.fontSize = "14px";
  btn.style.cursor = "pointer";
  btn.style.background = "#4caf50";
  btn.style.color = "#fff";
  btn.style.border = "none";
  btn.style.borderRadius = "4px";
  btn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
  document.body.appendChild(btn);

  btn.addEventListener("click", () => {
    // updateDataFull.js の内容を文字列としてコピー
    const dataFull = `/* ============================
   updateDataFull.js — 管理者用追加データ（フル版）
   - 複数カード・合言葉・更新履歴をまとめて追加
   - script.js の下に読み込む
   ============================ */

(function() {
  const newCards = [
    {id:"c20001", name:"夏祭りカード", slots:5, addPass:"natsu2025", bg:"#ffefd5", stampIcon:"🎆", notifyMsg:"夏祭りスタンプを集めよう！", maxNotifyMsg:"通知上限"},
    {id:"c20002", name:"秋の読書カード", slots:4, addPass:"aki2025", bg:"#f5deb3", stampIcon:"📚", notifyMsg:"読書スタンプを集めよう！", maxNotifyMsg:"通知上限"},
    {id:"c20003", name:"冬のイルミカード", slots:6, addPass:"fuyu2025", bg:"#e0f7fa", stampIcon:"❄️", notifyMsg:"イルミネーションスタンプを集めよう！", maxNotifyMsg:"通知上限"}
  ];
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
  const newUpdates = [
    {date:"2025年8月24日", msg:"『夏祭りカード』を追加しました"},
    {date:"2025年8月24日", msg:"『夏祭りカード』の合言葉を追加しました"},
    {date:"2025年8月24日", msg:"『秋の読書カード』を追加しました"},
    {date:"2025年8月24日", msg:"『秋の読書カード』の合言葉を追加しました"},
    {date:"2025年8月24日", msg:"『冬のイルミカード』を追加しました"},
    {date:"2025年8月24日", msg:"『冬のイルミカード』の合言葉を追加しました"}
  ];

  function loadJSON(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){return fallback;} }
  function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

  let cards = loadJSON("cards", []);
  newCards.forEach(nc => { if(!cards.some(c=>c.id===nc.id)) cards.push(nc); });
  saveJSON("cards", cards);

  let keywords = loadJSON("keywords", []);
  newKeywords.forEach(nk => { if(!keywords.some(k=>k.cardId===nk.cardId && k.word===nk.word)) keywords.push(nk); });
  saveJSON("keywords", keywords);

  let updates = loadJSON("updates", []);
  newUpdates.forEach(nu => updates.push(nu));
  saveJSON("updates", updates);

  console.log("管理者追加データ（フル版）を適用しました");
})();`;

    navigator.clipboard.writeText(dataFull).then(()=>{
      alert("updateDataFull.js の内容をコピーしました。\nこのまま上書きコミットできます。");
    }).catch(err=>{
      console.error(err);
      alert("コピーに失敗しました。ブラウザの権限を確認してください。");
    });
  });
})();