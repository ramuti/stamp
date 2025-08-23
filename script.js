/* ============================
   script.js — ユーザー＋管理者 共通
   ============================ */

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

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
}
function saveJSON(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }

let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);

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
    if(card.bg){
      container.style.background = card.bg;
    }

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
      if (!keywordObj) { alert("合言葉が違うか無効です"); return; }

      const usedSameKeyword = userStampHistory.some(s => s.cardId === card.id && s.keyword === word);
      if (usedSameKeyword) { alert("もう押してあります"); return; }

      let nextSlot = 0;
      while (userStampHistory.some(s => s.cardId === card.id && s.slot === nextSlot)) nextSlot++;
      if (nextSlot >= card.slots) { alert(card.maxNotifyMsg || "スタンプがMAXです"); return; }

      userStampHistory.push({ cardId: card.id, slot: nextSlot, keyword: word, date: new Date().toLocaleString() });
      saveJSON(LS_KEYS.userStampHistory, userStampHistory);
      renderUserCards();
      updateHistory();
      alert(card.notifyMsg || "スタンプを押しました！");
    });
    container.appendChild(btn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "カードを削除";
    delBtn.style.background = "#999";
    delBtn.style.marginLeft = "8px";
    delBtn.addEventListener("click", () => {
      if (!confirm("このカードを自分の端末から削除しますか？（履歴も消えます）")) return;
      userAddedCards = userAddedCards.filter(id => id !== card.id);
      userStampHistory = userStampHistory.filter(h => h.cardId !== card.id);
      saveAll();
      renderUserCards();
      updateHistory();
    });
    container.appendChild(delBtn);

    return container;
  }

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(id => {
      const card = cards.find(c => c.id === id);
      if (card) userCards.appendChild(renderUserCard(card));
    });
  }

  function updateHistory() {
    historyList.innerHTML = "";
    [...userStampHistory].reverse().forEach(h => {
      const card = cards.find(c => c.id === h.cardId);
      if (!card) return;
      const li = document.createElement("li");
      li.textContent = `${card.name} — ${h.date}`;
      historyList.appendChild(li);
    });
    updateLogs.innerHTML = "";
    updates.slice().reverse().forEach(u => {
      const div = document.createElement("div");
      div.textContent = u;
      updateLogs.appendChild(div);
    });
  }

  function genSerialForUser() { return (userStampHistory.length + 1).toString().padStart(5, "0"); }

  renderUserCards();
  updateHistory();
}

/* ============================
   管理者側
   ============================ */
function initAdmin() {
  const cardName = document.getElementById("cardName");
  const cardSlots = document.getElementById("cardSlots");
  const notifyMsg = document.getElementById("notifyMsg");
  const maxNotifyMsg = document.getElementById("maxNotifyMsg");
  const addPass = document.getElementById("addPass");
  const stampIcon = document.getElementById("stampIcon");
  const createCardBtn = document.getElementById("createCardBtn");
  const previewArea = document.getElementById("previewArea");
  const adminCards = document.getElementById("adminCards");
  const bgR = document.getElementById("bgR");
  const bgG = document.getElementById("bgG");
  const bgB = document.getElementById("bgB");
  const previewClearBtn = document.getElementById("previewClearBtn");

  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  function renderCardPreview() {
    previewArea.innerHTML = "";
    const tempCard = {
      id: "preview",
      name: cardName.value || "プレビュー",
      slots: parseInt(cardSlots.value) || 5,
      bg: `rgb(${bgR.value||255},${bgG.value||255},${bgB.value||255})`
    };
    const div = document.createElement("div");
    div.className = "card";
    div.style.background = tempCard.bg;
    const h3 = document.createElement("h3");
    h3.textContent = tempCard.name;
    div.appendChild(h3);
    for(let i=0;i<tempCard.slots;i++){
      const slot = document.createElement("div");
      slot.className="stamp-slot";
      div.appendChild(slot);
    }
    previewArea.appendChild(div);
  }

  [cardName, cardSlots, bgR, bgG, bgB].forEach(el => el.addEventListener("input", renderCardPreview));
  previewClearBtn.addEventListener("click", () => previewArea.innerHTML="");

  function renderAdminCards() {
    adminCards.innerHTML = "";
    cards.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c.name;
      const delBtn = document.createElement("button");
      delBtn.textContent="削除";
      delBtn.style.background="#999";
      delBtn.addEventListener("click", ()=>{
        if(confirm("削除しますか？")) {
          cards = cards.filter(x=>x.id!==c.id);
          saveAll();
          renderAdminCards();
          renderKeywordSelect();
        }
      });
      li.appendChild(delBtn);
      adminCards.appendChild(li);
    });
  }

  function renderKeywordSelect() {
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const opt = document.createElement("option");
      opt.value=c.id; opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderKeywordList(){
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      const card=cards.find(c=>c.id===k.cardId);
      li.textContent=`[${card?card.name:"削除済み"}] ${k.word}`;
      const delBtn=document.createElement("button");
      delBtn.textContent="削除";
      delBtn.style.background="#999";
      delBtn.addEventListener("click",()=>{
        keywords=keywords.filter(x=>x!==k);
        saveAll();
        renderKeywordList();
      });
      li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }

  function renderUpdateLogs(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const div=document.createElement("div");
      div.textContent=u;
      adminUpdateLogs.appendChild(div);
    });
  }

  createCardBtn.addEventListener("click",()=>{
    const id=Date.now().toString();
    const card={
      id,
      name: cardName.value.trim()||"無題",
      slots: parseInt(cardSlots.value)||5,
      notifyMsg: notifyMsg.value.trim(),
      maxNotifyMsg: maxNotifyMsg.value.trim(),
      addPass: addPass.value.trim(),
      stampIcon: stampIcon.value.trim(),
      bg:`rgb(${bgR.value||255},${bgG.value||255},${bgB.value||255})`
    };
    cards.push(card);
    saveAll();
    renderAdminCards();
    renderKeywordSelect();
    renderCardPreview();
    alert("カードを作成しました");
  });

  addKeywordBtn.addEventListener("click",()=>{
    const cardId=keywordCardSelect.value;
    const word=keywordInput.value.trim();
    if(!word){ alert("合言葉を入力してください"); return; }
    keywords.push({cardId, word, active:true});
    saveAll();
    renderKeywordList();
    keywordInput.value="";
  });

  addUpdateBtn.addEventListener("click",()=>{
    const txt=updateInput.value.trim();
    if(!txt) return;
    updates.push(txt);
    saveAll();
    renderUpdateLogs();
    updateInput.value="";
  });

  renderAdminCards();
  renderKeywordSelect();
  renderKeywordList();
  renderUpdateLogs();
  renderCardPreview();
}