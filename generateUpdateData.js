/* ============================
   generateUpdateData.js — 管理者用補助
   - 新カード・合言葉・更新履歴を生成
   - 「コピー」ボタンで updateDataFull.js に貼る内容を取得
   ============================ */

(function() {
  // --- 追加データ（例） ---
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

  // コピー用文字列生成
  function generateUpdateData() {
    return `/* ============================\n   updateDataFull.js — 管理者追加データ（フル版）\n   ============================ */\n\n(function(){\n` +
      `const newCards = ${JSON.stringify(newCards, null, 2)};\n\n` +
      `const newKeywords = ${JSON.stringify(newKeywords, null, 2)};\n\n` +
      `const newUpdates = ${JSON.stringify(newUpdates, null, 2)};\n\n` +
      `function loadJSON(key,f){try{const v=localStorage.getItem(key);return v?JSON.parse(v):f}catch(e){return f}}\n` +
      `function saveJSON(key,obj){localStorage.setItem(key,JSON.stringify(obj))}\n` +
      `let cards=loadJSON("cards",[]);newCards.forEach(nc=>{if(!cards.some(c=>c.id===nc.id))cards.push(nc)});saveJSON("cards",cards);\n` +
      `let keywords=loadJSON("keywords",[]);newKeywords.forEach(nk=>{if(!keywords.some(k=>k.cardId===nk.cardId&&k.word===nk.word))keywords.push(nk)});saveJSON("keywords",keywords);\n` +
      `let updates=loadJSON("updates",[]);newUpdates.forEach(nu=>updates.push(nu));saveJSON("updates",updates);\n` +
      `console.log("管理者追加データ（フル版）を適用しました");})();`;
  }

  // 「コピー」ボタン作成
  const btn = document.createElement("button");
  btn.textContent = "コピー updateDataFull.js 内容";
  btn.style.position = "fixed";
  btn.style.bottom = "10px";
  btn.style.right = "10px";
  btn.style.zIndex = 9999;
  btn.onclick = () => {
    navigator.clipboard.writeText(generateUpdateData()).then(
      () => alert("コピーしました！updateDataFull.js に貼り付け可能です。"),
      () => alert("コピーに失敗しました。")
    );
  };
  document.body.appendChild(btn);
})();