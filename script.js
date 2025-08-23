/* ============================
   script.js — ユーザー＋管理者 共通
   ============================ */

/* --- 初期ロードするデータ／キー --- */
const LS_KEYS = {
  appVersion: "appVersion",
  userName: "userName",
  cards: "cards",
  keywords: "keywords",
  updates: "updates",
  userAddedCards: "userAddedCards",
  userStampHistory: "userStampHistory"
};

const APP_VERSION = "v1.0.0";

/* load helper */
function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
}
function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

/* app state */
let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);

/* save all */
function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.userName, userName);
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);
    saveJSON(LS_KEYS.userAddedCards, userAddedCards);
    saveJSON(LS_KEYS.userStampHistory, userStampHistory);
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
  } catch (e) {
    alert("データ保存に失敗しました。");
    console.error(e);
  }
}

/* DOM ready init */
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if (body.classList.contains("user")) initUser();
  if (body.classList.contains("admin")) initAdmin();
});

/* ============================
   ユーザー側
   ============================ */
function initUser() {
  const setNameBtn = document.getElementById("setNameBtn");
  const userNameInput = document.getElementById("userNameInput");
  const cardTitle = document.getElementById("cardTitle");
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardPass = document.getElementById("addCardPass");
  const userCardsDiv = document.getElementById("userCards");
  const stampHistoryUl = document.getElementById("stampHistory");
  const updateLogsDiv = document.getElementById("updateLogs");

  const bgPicker = document.getElementById("userBgColor");
  const textPicker = document.getElementById("userTextColor");
  const btnPicker = document.getElementById("userBtnColor");

  function applyColors() {
    document.body.style.backgroundColor = bgPicker.value;
    document.body.style.color = textPicker.value;
    document.querySelectorAll("button").forEach(b => b.style.backgroundColor = btnPicker.value);
  }
  bgPicker.addEventListener("input", applyColors);
  textPicker.addEventListener("input", applyColors);
  btnPicker.addEventListener("input", applyColors);
  applyColors();

  userNameInput.value = userName;
  setNameBtn.addEventListener("click", () => {
    userName = userNameInput.value.trim();
    saveAll();
    alert("名前を変更しました：" + userName);
  });

  function renderUserCards() {
    userCardsDiv.innerHTML = "";
    userAddedCards.forEach((c,i)=>{
      const div = document.createElement("div");
      div.className = "card";
      div.textContent = `カード名: ${c.name}, 追加パス: ${c.addPass}`;
      userCardsDiv.appendChild(div);
    });
  }

  function renderStampHistory() {
    stampHistoryUl.innerHTML = "";
    if(userAddedCards.length === 0) return;
    userStampHistory.forEach(h=>{
      const li = document.createElement("li");
      li.textContent = h;
      stampHistoryUl.appendChild(li);
    });
  }

  function renderUpdates() {
    updateLogsDiv.innerHTML = "";
    updates.forEach(u=>{
      const div = document.createElement("div");
      div.textContent = u;
      updateLogsDiv.appendChild(div);
    });
  }

  addCardBtn.addEventListener("click", ()=>{
    const pass = addCardPass.value.trim();
    const card = cards.find(c=>c.addPass===pass);
    if(!card){ alert("パスが一致するカードがありません"); return; }
    userAddedCards.push(card);
    saveAll();
    renderUserCards();
    renderStampHistory();
  });

  renderUserCards();
  renderStampHistory();
  renderUpdates();
}

/* ============================
   管理者側
   ============================ */
function initAdmin() {
  const cardNameInput = document.getElementById("cardName");
  const cardSlotsInput = document.getElementById("cardSlots");
  const addPassInput = document.getElementById("addPass");
  const notifyInput = document.getElementById("notifyMsg");
  const maxNotifyInput = document.getElementById("maxNotifyMsg");
  const stampIconInput = document.getElementById("stampIcon");
  const cardBGInput = document.getElementById("cardBG");
  const createCardBtn = document.getElementById("createCardBtn");
  const previewCardBtn = document.getElementById("previewCardBtn");
  const previewClearBtn = document.getElementById("previewClearBtn");
  const adminCardsUl = document.getElementById("adminCards");

  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordListUl = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogsDiv = document.getElementById("adminUpdateLogs");

  const previewArea = document.getElementById("previewArea");

  function renderAdminCards() {
    adminCardsUl.innerHTML = "";
    cards.forEach((c,i)=>{
      const li = document.createElement("li");
      li.innerHTML = `<span>${c.name}</span> <span>${c.addPass}</span> <button data-index="${i}" class="previewBtn">プレビュー</button> <button data-index="${i}" class="deleteBtn">消去</button>`;
      adminCardsUl.appendChild(li);
    });
    Array.from(document.querySelectorAll(".deleteBtn")).forEach(btn=>{
      btn.addEventListener("click", e=>{
        const idx = parseInt(e.target.dataset.index);
        if(confirm("削除しますか？")) {
          cards.splice(idx,1);
          saveAll();
          renderAdminCards();
        }
      });
    });
    Array.from(document.querySelectorAll(".previewBtn")).forEach(btn=>{
      btn.addEventListener("click", e=>{
        const idx = parseInt(e.target.dataset.index);
        const c = cards[idx];
        previewArea.innerHTML = "";
        const div = document.createElement("div");
        div.className="card";
        div.style.backgroundColor = c.bgColor;
        div.textContent = `カード名: ${c.name}  枠数: ${c.slots}  追加パス: ${c.addPass}`;
        previewArea.appendChild(div);
      });
    });
  }

  createCardBtn.addEventListener("click", ()=>{
    const name = cardNameInput.value.trim();
    const slots = parseInt(cardSlotsInput.value);
    const addPass = addPassInput.value.trim();
    const notifyMsg = notifyInput.value.trim();
    const maxNotifyMsg = maxNotifyInput.value.trim();
    const stampIcon = stampIconInput.value.trim();
    const bgColor = cardBGInput.value;

    if(!name || !addPass){ alert("カード名と追加パスは必須です"); return; }

    const newCard = { name, slots, addPass, notifyMsg, maxNotifyMsg, stampIcon, bgColor };
    cards.push(newCard);
    saveAll();
    renderAdminCards();
  });

  previewCardBtn.addEventListener("click", ()=>{
    const name = cardNameInput.value.trim();
    const slots = parseInt(cardSlotsInput.value);
    const addPass = addPassInput.value.trim();
    const bgColor = cardBGInput.value;
    if(!name){ alert("カード名を入力してください"); return; }
    previewArea.innerHTML="";
    const div = document.createElement("div");
    div.className="card";
    div.style.backgroundColor = bgColor;
    div.textContent = `カード名: ${name}  枠数: ${slots}  追加パス: ${addPass}`;
    previewArea.appendChild(div);
  });

  previewClearBtn.addEventListener("click", ()=>{ previewArea.innerHTML=""; });

  /* キーワード関連 */
  function renderKeywords() {
    keywordListUl.innerHTML = "";
    keywords.forEach((k,i)=>{
      const li = document.createElement("li");
      li.innerHTML = `<span>${k.cardName}: ${k.keyword}</span> <button data-index="${i}" class="deleteKeywordBtn">消去</button>`;
      keywordListUl.appendChild(li);
    });
    Array.from(document.querySelectorAll(".deleteKeywordBtn")).forEach(btn=>{
      btn.addEventListener("click", e=>{
        const idx = parseInt(e.target.dataset.index);
        if(confirm("削除しますか？")) {
          keywords.splice(idx,1);
          saveAll();
          renderKeywords();
        }
      });
    });

    keywordCardSelect.innerHTML = "";
    cards.forEach((c,i)=>{
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  addKeywordBtn.addEventListener("click", ()=>{
    const selectedCard = keywordCardSelect.value;
    const kw = keywordInput.value.trim();
    if(!selectedCard || !kw){ alert("カードとキーワードを入力してください"); return; }
    keywords.push({ cardName: selectedCard, keyword: kw });
    saveAll();
    renderKeywords();
  });

  /* 更新履歴 */
  function renderUpdates() {
    adminUpdateLogsDiv.innerHTML = "";
    updates.forEach((u,i)=>{
      const div = document.createElement("div");
      div.textContent = u;
      adminUpdateLogsDiv.appendChild(div);
    });
  }

  addUpdateBtn.addEventListener("click", ()=>{
    const text = updateInput.value.trim();
    if(!text){ alert("更新内容を入力してください"); return; }
    updates.push(text);
    saveAll();
    renderUpdates();
  });

  renderAdminCards();
  renderKeywords();
  renderUpdates();
}