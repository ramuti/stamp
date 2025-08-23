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
  const userCards = document.getElementById("userCards");
  const historyList = document.getElementById("stampHistory");
  const updateLogs = document.getElementById("updateLogs");

  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value = userName;

  setNameBtn.addEventListener("click", () => {
    const v = userNameInput.value.trim();
    if (!v) { alert("名前を入力してください"); return; }
    userName = v;
    saveAll();
    cardTitle.textContent = `${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click", () => {
    const pass = addCardPass.value.trim();
    if (!pass) { alert("追加パスを入力してください"); return; }
    const card = cards.find(c => c.addPass === pass);
    if (!card) { alert("パスが間違っています"); return; }
    if (!userAddedCards.includes(card.id)) {
      userAddedCards.push(card.id);
      saveJSON(LS_KEYS.userAddedCards, userAddedCards);
      renderUserCards();
      addCardPass.value = "";
    } else { alert("すでに追加済みです"); }
  });

  function renderUserCard(card) {
    const container = document.createElement("div");
    container.className = "card";
    container.dataset.id = card.id;

    const title = document.createElement("h3");
    title.textContent = card.name;
    container.appendChild(title);

    const slotsDiv = document.createElement("div");
    for (let i=0;i<card.slots;i++){
      const slot = document.createElement("div");
      slot.className = "stamp-slot";
      if (userStampHistory.includes(`${card.id}_${i}`)) slot.classList.add("stamp-filled");
      slotsDiv.appendChild(slot);
    }
    container.appendChild(slotsDiv);
    return container;
  }

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(cid => {
      const card = cards.find(c => c.id === cid);
      if (card) userCards.appendChild(renderUserCard(card));
    });
  }

  function renderHistory() {
    historyList.innerHTML = "";
    userStampHistory.forEach(h=>{
      const li = document.createElement("li");
      li.textContent = h;
      historyList.appendChild(li);
    });
  }

  function renderUpdates() {
    updateLogs.innerHTML = "";
    updates.forEach(u=>{
      const d = document.createElement("div");
      d.textContent = u;
      updateLogs.appendChild(d);
    });
  }

  renderUserCards();
  renderHistory();
  renderUpdates();
}

/* ============================
   管理者側
   ============================ */
function initAdmin() {
  const cardNameInput = document.getElementById("cardName");
  const cardSlotsInput = document.getElementById("cardSlots");
  const addPassInput = document.getElementById("addPass");
  const createCardBtn = document.getElementById("createCardBtn");
  const adminCards = document.getElementById("adminCards");
  const previewArea = document.getElementById("previewArea");

  const keywordInput = document.getElementById("keywordInput");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  function renderAdminCards() {
    adminCards.innerHTML = "";
    keywordCardSelect.innerHTML = "";
    cards.forEach(c=>{
      const li = document.createElement("li");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = c.name;
      li.appendChild(nameSpan);

      const passSpan = document.createElement("span");
      passSpan.textContent = c.addPass || "";
      li.appendChild(passSpan);

      const previewBtn = document.createElement("button");
      previewBtn.textContent = "プレビュー";
      previewBtn.addEventListener("click", ()=>{
        previewArea.innerHTML = "";
        const div = document.createElement("div");
        div.className = "card";
        div.textContent = c.name + " プレビュー";
        previewArea.appendChild(div);
      });
      li.appendChild(previewBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "消去";
      deleteBtn.addEventListener("click", ()=>{
        if(confirm("削除しますか？")){
          cards = cards.filter(cc=>cc.id!==c.id);
          saveJSON(LS_KEYS.cards,cards);
          //カード削除に伴いユーザ履歴も消す
          userAddedCards = userAddedCards.filter(id => id!==c.id);
          userStampHistory = userStampHistory.filter(h=>!h.startsWith(c.id+"_"));
          saveAll();
          renderAdminCards();
        }
      });
      li.appendChild(deleteBtn);

      adminCards.appendChild(li);

      // セレクトに追加
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = c.name;
      keywordCardSelect.appendChild(option);
    });
  }

  createCardBtn.addEventListener("click",()=>{
    const name = cardNameInput.value.trim();
    const slots = parseInt(cardSlotsInput.value) || 5;
    const addPass = addPassInput.value.trim();
    if(!name){ alert("カード名を入力"); return; }
    const newCard = {
      id: Date.now().toString(),
      name,
      slots,
      addPass
    };
    cards.push(newCard);
    saveJSON(LS_KEYS.cards,cards);
    renderAdminCards();
  });

  function renderKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach(k=>{
      const li = document.createElement("li");
      li.textContent = `${k.cardName} : ${k.keyword}`;
      const delBtn = document.createElement("button");
      delBtn.textContent = "消去";
      delBtn.addEventListener("click",()=>{
        keywords = keywords.filter(kk=>kk!==k);
        saveJSON(LS_KEYS.keywords,keywords);
        renderKeywords();
      });
      li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }

  addKeywordBtn.addEventListener("click",()=>{
    const kw = keywordInput.value.trim();
    const cardId = keywordCardSelect.value;
    const card = cards.find(c=>c.id===cardId);
    if(!kw||!card){ alert("カード選択またはキーワード入力"); return; }
    const newKeyword = { cardId: card.id, cardName: card.name, keyword: kw, active:true };
    keywords.push(newKeyword);
    saveJSON(LS_KEYS.keywords,keywords);
    renderKeywords();
    keywordInput.value="";
  });

  renderAdminCards();
  renderKeywords();

  addUpdateBtn.addEventListener("click",()=>{
    const txt = updateInput.value.trim();
    if(!txt) return;
    updates.push(txt);
    saveJSON(LS_KEYS.updates,updates);
    const d = document.createElement("div"); d.textContent=txt;
    adminUpdateLogs.appendChild(d);
    updateInput.value="";
  });

  // 初回レンダリング
  updates.forEach(u=>{
    const d = document.createElement("div"); d.textContent=u;
    adminUpdateLogs.appendChild(d);
  });
}