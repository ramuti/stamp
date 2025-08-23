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
    container.style.background = card.bg || "#fff0f5";

    const title = document.createElement("h3");
    title.textContent = card.name;
    container.appendChild(title);

    const grid = document.createElement("div");
    grid.style.marginBottom = "8px";
    for (let i = 0; i < card.slots; i++) {
      const slot = document.createElement("div");
      slot.className = "stamp-slot";
      if (userStampHistory.some(s => s.cardId === card.id && s.slot === i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial = document.createElement("div");
    serial.className = "serial";
    serial.textContent = genSerialForUser();
    container.appendChild(serial);

    const btn = document.createElement("button");
    btn.textContent = "スタンプを押す";
    btn.style.marginTop = "8px";
    btn.addEventListener("click", () => {
      const kw = prompt("スタンプ合言葉を入力してください");
      if (kw === null) return;
      const word = kw.trim();
      if (!word) { alert("合言葉を入力してください"); return; }

      const keywordObj = keywords.find(k => String(k.cardId) === String(card.id) && k.word === word && k.active);
      if (!keywordObj) { alert("合言葉が違います"); return; }

      const filled = userStampHistory.filter(s => s.cardId === card.id);
      if (filled.length >= card.slots) { alert("スタンプはMAXです"); return; }

      userStampHistory.push({ cardId: card.id, slot: filled.length });
      saveJSON(LS_KEYS.userStampHistory, userStampHistory);
      renderUserCards();
    });
    container.appendChild(btn);

    return container;
  }

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(cid => {
      const card = cards.find(c => c.id === cid);
      if (!card) return;
      userCards.appendChild(renderUserCard(card));
    });
  }

  function renderUpdates() {
    updateLogs.innerHTML = "";
    updates.forEach(u => {
      const d = document.createElement("div");
      d.textContent = u;
      updateLogs.appendChild(d);
    });
  }

  renderUserCards();
  renderUpdates();

  function genSerialForUser() {
    const now = Date.now();
    const rand = Math.floor(Math.random()*1000);
    return `#${now}${rand}`;
  }
}

/* ============================
   管理者側
   ============================ */
function initAdmin() {
  const cardNameInput = document.getElementById("cardName");
  const cardSlotsInput = document.getElementById("cardSlots");
  const addPassInput = document.getElementById("addPass");
  const notifyMsgInput = document.getElementById("notifyMsg");
  const maxNotifyInput = document.getElementById("maxNotifyMsg");
  const stampIconInput = document.getElementById("stampIcon");
  const createCardBtn = document.getElementById("createCardBtn");
  const previewClearBtn = document.getElementById("previewClearBtn");
  const adminCardsList = document.getElementById("adminCards");
  const cardColorPicker = document.getElementById("cardColorPicker");
  const applyColorBtn = document.getElementById("applyColorBtn");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");
  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const previewArea = document.getElementById("previewArea");

  function generateCardId() { return Date.now() + Math.floor(Math.random()*1000); }

  createCardBtn.addEventListener("click", () => {
    const name = cardNameInput.value.trim();
    const slots = parseInt(cardSlotsInput.value);
    const addPass = addPassInput.value.trim();
    const notifyMsg = notifyMsgInput.value.trim();
    const maxNotifyMsg = maxNotifyInput.value.trim();
    const stampIcon = stampIconInput.value.trim();

    if (!name || !slots || !addPass) { alert("カード名・枠数・追加パスは必須です"); return; }

    const newCard = {
      id: generateCardId(),
      name, slots, addPass, bg: "#fff0f5", notifyMsg, maxNotifyMsg, stampIcon
    };
    cards.push(newCard);
    saveAll();
    renderAdminCards();
    renderKeywordCardSelect();
    previewCard(newCard);
  });

  previewClearBtn.addEventListener("click", () => previewArea.innerHTML="");

  function renderAdminCards() {
    adminCardsList.innerHTML="";
    cards.forEach(c => {
      const li = document.createElement("li");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = c.name;
      li.appendChild(nameSpan);

      const addPassSpan = document.createElement("span");
      addPassSpan.textContent = c.addPass;
      li.appendChild(addPassSpan);

      const previewBtn = document.createElement("button");
      previewBtn.textContent = "プレビュー";
      previewBtn.addEventListener("click", () => previewCard(c));
      li.appendChild(previewBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "消去";
      delBtn.addEventListener("click", () => {
        if (!confirm("本当に削除しますか？")) return;
        cards = cards.filter(x=>x.id!==c.id);
        saveAll();
        renderAdminCards();
        renderKeywordCardSelect();
      });
      li.appendChild(delBtn);

      adminCardsList.appendChild(li);
    });
  }

  function previewCard(card) {
    previewArea.innerHTML = "";
    const div = document.createElement("div");
    div.className="card";
    div.style.background = card.bg;
    const title = document.createElement("h3");
    title.textContent = card.name;
    div.appendChild(title);
    for(let i=0;i<card.slots;i++){
      const slot = document.createElement("div");
      slot.className="stamp-slot";
      div.appendChild(slot);
    }
    previewArea.appendChild(div);
  }

  applyColorBtn.addEventListener("click", () => {
    const c = cardColorPicker.value;
    cards.forEach(card => card.bg = c);
    saveAll();
    renderAdminCards();
    previewArea.innerHTML="";
  });

  /* キーワード */
  addKeywordBtn.addEventListener("click", () => {
    const cardId = parseInt(keywordCardSelect.value);
    const word = keywordInput.value.trim();
    if (!word) { alert("合言葉を入力"); return; }
    keywords.push({ cardId, word, active: true });
    saveJSON(LS_KEYS.keywords, keywords);
    renderKeywordList();
    keywordInput.value="";
  });

  function renderKeywordCardSelect() {
    keywordCardSelect.innerHTML="";
    cards.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderKeywordList() {
    const list = document.getElementById("keywordList");
    list.innerHTML="";
    keywords.forEach(k => {
      const li = document.createElement("li");
      const card = cards.find(c=>c.id===k.cardId);
      li.textContent = `${card ? card.name : "削除済カード"} : ${k.word}`;
      const delBtn = document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        keywords=keywords.filter(x=>x!==k);
        saveJSON(LS_KEYS.keywords,keywords);
        renderKeywordList();
      });
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  }

  /* 更新履歴 */
  addUpdateBtn.addEventListener("click", () => {
    const msg = updateInput.value.trim();
    if(!msg){alert("内容を入力してください"); return;}
    updates.push(msg);
    saveJSON(LS_KEYS.updates,updates);
    renderUpdateLogs();
    updateInput.value="";
  });

  function renderUpdateLogs() {
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const div=document.createElement("div");
      div.textContent = u;
      adminUpdateLogs.appendChild(div);
    });
  }

  /* 初期描画 */
  renderAdminCards();
  renderKeywordCardSelect();
  renderKeywordList();
  renderUpdateLogs();
}