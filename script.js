/* ============================
   script.js — ユーザー＋管理者 共通（フル）
   ============================ */

const LS_KEYS = {
  appVersion: "appVersion",
  userName: "userName",
  cards: "cards",
  keywords: "keywords",
  updates: "updates",
  userAddedCards: "userAddedCards",
  userStampHistory: "userStampHistory",
  userCardSerials: "userCardSerials",
  userUIColors: "userUIColors"
};

const APP_VERSION = "v1.2.0";

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
let userCardSerials = loadJSON(LS_KEYS.userCardSerials, {});
let userUIColors = loadJSON(LS_KEYS.userUIColors, {text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});

function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.userName, userName);
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);
    saveJSON(LS_KEYS.userAddedCards, userAddedCards);
    saveJSON(LS_KEYS.userStampHistory, userStampHistory);
    saveJSON(LS_KEYS.userCardSerials, userCardSerials);
    saveJSON(LS_KEYS.userUIColors, userUIColors);
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
  } catch (e) { alert("データ保存に失敗"); console.error(e); }
}

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if (body.classList.contains("user")) initUser();
  if (body.classList.contains("admin")) initAdmin();
});

/* =========================
   ユーザー画面
   ========================= */
function initUser() {
  const setNameBtn   = document.getElementById("setNameBtn");
  const userNameInput= document.getElementById("userNameInput");
  const cardTitle    = document.getElementById("cardTitle");
  const addCardBtn   = document.getElementById("addCardBtn");
  const addCardPass  = document.getElementById("addCardPass");
  const userCards    = document.getElementById("userCards");
  const historyList  = document.getElementById("stampHistory");
  const updateLogs   = document.getElementById("updateLogs");

  const textColorPicker = document.getElementById("textColor");
  const bgColorPicker = document.getElementById("bgColor");
  const btnColorPicker = document.getElementById("btnColor");

  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value = userName;

  textColorPicker.value = userUIColors.text;
  bgColorPicker.value = userUIColors.bg;
  btnColorPicker.value = userUIColors.btn;

  applyUserColors();

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

      // ユーザ固有シリアル生成
      if(!userCardSerials[card.id]) userCardSerials[card.id] = {};
      if(!userCardSerials[card.id][userName]){
        const maxSerial = Object.values(userCardSerials[card.id]).length>0 ? Math.max(...Object.values(userCardSerials[card.id])) : 0;
        userCardSerials[card.id][userName] = maxSerial+1;
      }

      saveAll();
      renderUserCards();
      addCardPass.value = "";
    } else alert("すでに追加済みです");
  });

  function applyUserColors() {
    document.body.style.background = userUIColors.bg;
    document.body.style.color = userUIColors.text;
    cardTitle.style.color = userUIColors.text;
    document.querySelectorAll("button").forEach(btn=>{
      btn.style.background = userUIColors.btn;
      btn.style.color = userUIColors.text;
    });
  }

  textColorPicker.addEventListener("input", () => { userUIColors.text = textColorPicker.value; saveAll(); applyUserColors(); });
  bgColorPicker.addEventListener("input", () => { userUIColors.bg = bgColorPicker.value; saveAll(); applyUserColors(); });
  btnColorPicker.addEventListener("input", () => { userUIColors.btn = btnColorPicker.value; saveAll(); applyUserColors(); });

  function renderUserCard(card) {
    const container = document.createElement("div");
    container.className = "card";
    container.dataset.id = card.id;
    if (card.bg) container.style.background = card.bg;

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

    // ユーザ固有シリアル表示
    const serial = document.createElement("div");
    serial.className = "serial";
    serial.textContent = `番号: ${userCardSerials[card.id][userName]}`;
    container.appendChild(serial);

    const btn = document.createElement("button");
    btn.textContent = "スタンプを押す";
    btn.style.marginTop = "8px";
    btn.addEventListener("click", () => handleStamp(card));
    container.appendChild(btn);

    return container;
  }

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(cid=>{
      const card = cards.find(c=>c.id===cid);
      if(card) userCards.appendChild(renderUserCard(card));
    });
  }

  function handleStamp(card){
    const kwList = keywords.filter(k=>k.cardId===card.id);
    if(!kwList.length) { alert("合言葉が設定されていません"); return; }

    const input = prompt("合言葉を入力してください");
    if(!input) return;
    const kw = kwList.find(k=>k.word===input);
    if(!kw || kw.disabled) { alert("無効の合言葉です"); return; }

    // 押せる枠を1つ探す
    const filled = userStampHistory.filter(s=>s.cardId===card.id).length;
    if(filled >= card.slots) { alert("全て埋まっています"); return; }

    userStampHistory.push({cardId: card.id, slot: filled, timestamp: new Date().toISOString()});
    saveAll();
    renderUserCards();
  }

  function renderHistory() {
    historyList.innerHTML = "";
    userStampHistory.forEach(s=>{
      const li = document.createElement("li");
      const card = cards.find(c=>c.id===s.cardId);
      li.textContent = `${card?card.name:"?カード"} スタンプ ${s.slot+1}`;
      historyList.appendChild(li);
    });
  }

  function renderUpdates() {
    updateLogs.innerHTML = "";
    updates.forEach(u=>{
      const div = document.createElement("div");
      div.textContent = u.date + " " + u.text;
      updateLogs.appendChild(div);
    });
  }

  renderUserCards();
  renderHistory();
  renderUpdates();
}

/* =========================
   管理者画面
   ========================= */
function initAdmin() {
  const cardName = document.getElementById("cardName");
  const cardSlots = document.getElementById("cardSlots");
  const addPass = document.getElementById("addPass");
  const notifyMsg = document.getElementById("notifyMsg");
  const maxNotifyMsg = document.getElementById("maxNotifyMsg");
  const cardBG = document.getElementById("cardBG");
  const stampIcon = document.getElementById("stampIcon");
  const previewArea = document.getElementById("previewArea");
  const createCardBtn = document.getElementById("createCardBtn");
  const adminCards = document.getElementById("adminCards");

  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  function renderAdminCards() {
    adminCards.innerHTML = "";
    cards.forEach(c=>{
      const li = document.createElement("li");
      const info = document.createElement("div"); info.className="info";
      info.textContent = `${c.name} / 枠:${c.slots} / パス:${c.addPass}`;
      const btns = document.createElement("div"); btns.className="btns";

      const delBtn = document.createElement("button"); delBtn.textContent="削除";
      delBtn.addEventListener("click", ()=>{
        if(!confirm("本当に削除しますか？")) return;
        cards = cards.filter(x=>x.id!==c.id);
        userAddedCards = userAddedCards.filter(x=>x!==c.id);
        saveAll();
        renderAdminCards();
      });
      btns.appendChild(delBtn);
      li.appendChild(info);
      li.appendChild(btns);
      adminCards.appendChild(li);
    });
    renderKeywordCardSelect();
  }

  function renderKeywordCardSelect() {
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderKeywords() {
    keywordList.innerHTML="";
    keywords.forEach((k,i)=>{
      const li = document.createElement("li");
      const label = document.createElement("span"); label.textContent=k.word + (k.disabled?" (無効)":"");
      const toggleBtn = document.createElement("button"); toggleBtn.textContent = k.disabled?"有効にする":"無効にする";
      toggleBtn.addEventListener("click", ()=>{
        k.disabled = !k.disabled; saveAll(); renderKeywords();
      });
      const delBtn = document.createElement("button"); delBtn.textContent="削除";
      delBtn.addEventListener("click", ()=>{
        keywords.splice(i,1); saveAll(); renderKeywords();
      });
      li.appendChild(label); li.appendChild(toggleBtn); li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }

  function renderUpdates() {
    adminUpdateLogs.innerHTML="";
    updates.forEach((u,i)=>{
      const div = document.createElement("div");
      const spanText = document.createElement("span");
      spanText.textContent = `${u.date} ${u.text}`;
      const delBtn = document.createElement("button"); delBtn.textContent="削除";
      delBtn.addEventListener("click", ()=>{
        updates.splice(i,1); saveAll(); renderUpdates();
      });
      div.appendChild(spanText); div.appendChild(delBtn);
      adminUpdateLogs.appendChild(div);
    });
  }

  createCardBtn.addEventListener("click", ()=>{
    const name = cardName.value.trim(); if(!name){ alert("カード名を入力"); return; }
    const slots = parseInt(cardSlots.value); if(!slots){ alert("枠数入力"); return; }
    const pass = addPass.value.trim(); if(!pass){ alert("追加パス入力"); return; }

    const newCard = {
      id: Date.now().toString(),
      name:name,
      slots:slots,
      addPass:pass,
      bg: cardBG.value,
      notify: notifyMsg.value,
      maxNotify:maxNotifyMsg.value,
      stampIcon: stampIcon.value
    };
    cards.push(newCard);
    saveAll();
    renderAdminCards();
  });

  addKeywordBtn.addEventListener("click", ()=>{
    const cardId = keywordCardSelect.value; const word = keywordInput.value.trim();
    if(!word) return;
    keywords.push({cardId,word,disabled:false});
    saveAll(); renderKeywords();
  });

  addUpdateBtn.addEventListener("click", ()=>{
    const txt = updateInput.value.trim(); if(!txt) return;
    const dt = new Date();
    updates.push({text:txt,date:`${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日`});
    saveAll(); renderUpdates();
  });

  renderAdminCards();
  renderKeywords();
  renderUpdates();
}