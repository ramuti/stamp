/* ============================
   generateUpdateData.js — 管理者用コピー機能
   - 既存のカード・合言葉・更新履歴をまとめてコピー
   - script.js 下に読み込む
   ============================ */

document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains("admin")) return;

  // コピー用ボタン作成
  const btn = document.createElement("button");
  btn.textContent = "追加データをコピー";
  btn.style.marginTop = "8px";

  btn.addEventListener("click", () => {
    const data = `
/* ============================
   updateDataFull.js — 管理者用追加データ（フル版）
   - script.js 下に読み込む
   ============================ */

(function() {
  const newCards = ${JSON.stringify(cards, null, 2)};
  const newKeywords = ${JSON.stringify(keywords, null, 2)};
  const newUpdates = ${JSON.stringify(updates, null, 2)};

  function loadJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){return fallback;}
  }
  function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

  let cards_ = loadJSON("cards", []);
  newCards.forEach(nc => { if (!cards_.some(c => c.id === nc.id)) cards_.push(nc); });
  saveJSON("cards", cards_);

  let keywords_ = loadJSON("keywords", []);
  newKeywords.forEach(nk => { if (!keywords_.some(k => k.cardId===nk.cardId && k.word===nk.word)) keywords_.push(nk); });
  saveJSON("keywords", keywords_);

  let updates_ = loadJSON("updates", []);
  newUpdates.forEach(nu => updates_.push(nu));
  saveJSON("updates", updates_);

  console.log("管理者追加データ（フル版）を適用しました");
})();
    `.trim();

    navigator.clipboard.writeText(data).then(() => {
      alert("コピーしました！\nupdateDataFull.js に貼り付けてコミットしてください。");
    }, (err) => {
      alert("コピーに失敗しました");
      console.error(err);
    });
  });

  // 管理者画面の適当な場所に配置（更新履歴の上に）
  const adminPanel = document.getElementById("adminUpdateLogs");
  if (adminPanel) {
    adminPanel.parentNode.insertBefore(btn, adminPanel);
  }
});