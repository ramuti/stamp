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

  /* 表示設定 */
  const textColorPicker = document.getElementById("textColorPicker");
  const bgColorPicker = document.getElementById("bgColorPicker");
  const buttonColorPicker = document.getElementById("buttonColorPicker");

  function applyColors() {
    document.body.style.color = textColorPicker.value;
    document.body.style.background = bgColorPicker.value;
    document.querySelectorAll("button").forEach(b=>b.style.background=b.value || buttonColorPicker.value);
  }
  textColorPicker.addEventListener("input", applyColors);
  bgColorPicker.addEventListener("input", applyColors);
  buttonColorPicker.addEventListener("input", applyColors);
  applyColors();

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
    if (!card) { alert("パスが違います"); return; }
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
      const keywordObj = keywords.find(k => k.cardId===card.id && k.keyword===kw);
      if (!keywordObj) { alert("合言葉が違います"); return; }
      let nextSlot = 0;
      for (let i=0;i<card.slots;i++){
        if (!userStampHistory.some(s => s.cardId===card.id && s.slot===i)) { nextSlot=i; break; } else nextSlot=i+1;
      }
      if (nextSlot >= card.slots) { alert("全てのスタンプが埋まっています"); return; }
      userStampHistory.push({cardId: card.id, slot: nextSlot, date:new Date().toISOString()});
      saveJSON(LS_KEYS.userStampHistory, userStampHistory);
      renderUserCards();
    });
    container.appendChild(btn);
    return container;
  }

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(cid=>{
      const card = cards.find(c=>c.id===cid);
      if (!card) return;
      const cardEl = renderUserCard(card);
      userCards.appendChild(cardEl);
    });
    renderStampHistory();
    renderUpdateLogs();
  }

  function renderStampHistory() {
    historyList.innerHTML = "";
    userStampHistory.forEach(s=>{
      const li = document.createElement("li");
      const card = cards.find(c=>c.id===s.cardId);
      li.textContent = card ? `${card.name} スロット${s.slot+1} ${new Date(s.date).toLocaleString()}` : "";
      historyList.appendChild(li);
    });
  }

  function renderUpdateLogs() {
    updateLogs.innerHTML = "";
    updates.forEach(u=>{
      const div = document.createElement("div");
      div.textContent = u;
      updateLogs.appendChild(div);
    });
  }

  renderUserCards();
}


/* ============================
   管理者側
============================ */
function initAdmin(){
  const cardNameInput = document.getElementById("cardName");
  const cardSlotsInput = document.getElementById("cardSlots");
  const addPassInput = document.getElementById("addPass");
  const notifyMsgInput = document.getElementById("notifyMsg");
  const maxNotifyMsgInput = document.getElementById("maxNotifyMsg");
  const cardBGInput = document.getElementById("cardBG");
  const stampIconInput = document.getElementById("stampIcon");
  const createCardBtn = document.getElementById("createCardBtn");
  const previewCardBtn = document.getElementById("previewCardBtn");
  const previewClearBtn = document.getElementById("previewClearBtn");
  const adminCards = document.getElementById("adminCards");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const previewArea = document.getElementById("previewArea");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  function renderCards(){
    adminCards.innerHTML="";
    cards.forEach(card=>{
      const li = document.createElement("li");
      const infoDiv = document.createElement("div");
      infoDiv.className="info";
      infoDiv.textContent=`${card.name} | ${card.addPass} | プレビュー`;
      li.appendChild(infoDiv);

      const btnsDiv=document.createElement("div");
      btnsDiv.className="btns";

      const previewBtn=document.createElement("button");
      previewBtn.textContent="プレビュー";
      previewBtn.addEventListener("click",()=>{ renderPreview(card); });
      btnsDiv.appendChild(previewBtn);

      const delBtn=document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        if(!confirm("カード削除しますか？")) return;
        cards=cards.filter(c=>c.id!==card.id);
        keywords=keywords.filter(k=>k.cardId!==card.id);
        updates=updates.filter(u=>u.cardId!==card.id);
        saveAll(); renderCards(); renderKeywords(); renderUpdates();
      });
      btnsDiv.appendChild(delBtn);

      li.appendChild(btnsDiv);
      adminCards.appendChild(li);
    });
    renderKeywordSelect();
  }

  function renderKeywordSelect(){
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const opt=document.createElement("option");
      opt.value=c.id; opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderKeywords(){
    const keywordList=document.getElementById("keywordList");
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      li.textContent=`${cards.find(c=>c.id===k.cardId)?.name||""}: ${k.keyword}`;
      keywordList.appendChild(li);
    });
  }

  function renderUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const div=document.createElement("div");
      div.textContent=u.text||u;
      adminUpdateLogs.appendChild(div);
    });
  }

  function renderPreview(card){
    previewArea.innerHTML="";
    const div=document.createElement("div");
    div.className="card";
    div.style.background=card.bg;
    const title=document.createElement("h3"); title.textContent=card.name;
    div.appendChild(title);
    previewArea.appendChild(div);
  }

  createCardBtn.addEventListener("click",()=>{
    const name=cardNameInput.value.trim();
    const slots=parseInt(cardSlotsInput.value);
    const addPass=addPassInput.value.trim();
    const notify=notifyMsgInput.value.trim();
    const maxNotify=maxNotifyMsgInput.value.trim();
    const bg=cardBGInput.value;
    const stampIcon=stampIconInput.value.trim();
    if(!name||!slots||!addPass){ alert("カード情報未入力"); return; }
    const card={id:Date.now(), name, slots, addPass, notify, maxNotify, bg, stampIcon};
    cards.push(card); saveAll(); renderCards(); cardNameInput.value=""; addPassInput.value=""; stampIconInput.value="";
  });

  previewCardBtn.addEventListener("click",()=>{
    const card={name:cardNameInput.value, bg:cardBGInput.value};
    renderPreview(card);
  });
  previewClearBtn.addEventListener("click",()=>{ previewArea.innerHTML=""; });

  addKeywordBtn.addEventListener("click",()=>{
    const cardId=keywordCardSelect.value;
    const kw=keywordInput.value.trim();
    if(!kw||!cardId){ alert("キーワード未入力"); return; }
    keywords.push({cardId, keyword:kw}); saveAll(); renderKeywords();
    keywordInput.value="";
  });

  addUpdateBtn.addEventListener("click",()=>{
    const text=updateInput.value.trim();
    if(!text) return;
    updates.push({text}); saveAll(); renderUpdates();
    updateInput.value="";
  });

  renderCards();
  renderKeywords();
  renderUpdates();
}