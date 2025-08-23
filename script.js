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
  userUIColors: "userUIColors"
};

const APP_VERSION = "v1.1.1";

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
let userUIColors = loadJSON(LS_KEYS.userUIColors, {text:"#ff69b4",bg:"#fff0f5",btn:"#ff99cc"});

function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.userName, userName);
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);
    saveJSON(LS_KEYS.userAddedCards, userAddedCards);
    saveJSON(LS_KEYS.userStampHistory, userStampHistory);
    saveJSON(LS_KEYS.userUIColors, userUIColors);
    localStorage.setItem(LS_KEYS.appVersion, APP_VERSION);
  } catch (e) { alert("データ保存に失敗"); console.error(e); }
}

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if (body.classList.contains("user")) initUser();
  if (body.classList.contains("admin")) initAdmin();
});

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
      saveJSON(LS_KEYS.userAddedCards, userAddedCards);
      renderUserCards();
      addCardPass.value = "";
    } else alert("すでに追加済みです");
  });

  function applyUserColors() {
    document.body.style.background = userUIColors.bg;
    cardTitle.style.color = userUIColors.text;
    document.querySelectorAll("button").forEach(btn => { btn.style.background=userUIColors.btn; btn.style.color=userUIColors.text; });
    document.querySelectorAll("#stampHistory li,#updateLogs div").forEach(el=>el.style.color=userUIColors.text);
    document.querySelectorAll("label").forEach(l=>l.style.color=userUIColors.text);
    document.querySelectorAll("#adminCards .info,#keywordList li,#adminUpdateLogs div").forEach(el=>el.style.color=userUIColors.text);
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

    const serial = document.createElement("div");
    serial.className = "serial";
    serial.textContent = genSerialForUser();
    container.appendChild(serial);

    const btn = document.createElement("button");
    btn.textContent = "スタンプを押す";
    btn.style.marginTop = "8px";
    btn.addEventListener("click", () => {
      const kw = prompt("スタンプ合言葉を入力してください");
      if (kw===null) return;
      const word = kw.trim();
      if (!word) { alert("合言葉を入力してください"); return; }
      const keywordObj = keywords.find(k => String(k.cardId) === String(card.id) && k.word === word && k.active);
      if (!keywordObj) { alert("合言葉が違うか無効です"); return; }
      if (userStampHistory.some(s => s.cardId===card.id && s.keyword===word)) { alert("既に押してあります"); return; }

      let nextSlot=0; while(userStampHistory.some(s=>s.cardId===card.id && s.slot===nextSlot)) nextSlot++;
      if(nextSlot>=card.slots){alert(card.maxNotifyMsg||"スタンプがMAXです");return;}

      userStampHistory.push({cardId:card.id,slot:nextSlot,keyword:word,date:new Date().toLocaleString()});
      saveJSON(LS_KEYS.userStampHistory,userStampHistory);
      renderUserCards(); updateHistory();
      alert(card.notifyMsg||"スタンプを押しました！");
    });
    container.appendChild(btn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "カードを削除";
    delBtn.style.background="#999"; delBtn.style.marginLeft="8px";
    delBtn.addEventListener("click",()=>{
      if(!confirm("このカードを自分の端末から削除しますか？（履歴も消えます）")) return;
      userAddedCards=userAddedCards.filter(id=>id!==card.id);
      userStampHistory=userStampHistory.filter(h=>h.cardId!==card.id);
      saveAll(); renderUserCards(); updateHistory();
    });
    container.appendChild(delBtn);

    return container;
  }

  function renderUserCards() {
    userCards.innerHTML="";
    userAddedCards = userAddedCards.filter(id => cards.some(c=>c.id===id));
    userStampHistory = userStampHistory.filter(h=>cards.some(c=>c.id===h.cardId));
    saveAll();

    userAddedCards.forEach(id=>{
      const card = cards.find(c=>c.id===id);
      if(card) userCards.appendChild(renderUserCard(card));
    });
  }

  function updateHistory() {
    historyList.innerHTML="";
    [...userStampHistory].reverse().forEach(h=>{
      const card = cards.find(c=>c.id===h.cardId); if(!card) return;
      const li = document.createElement("li"); li.textContent=`${card.name} — ${h.date}`;
      li.style.color=userUIColors.text;
      historyList.appendChild(li);
    });

    updateLogs.innerHTML="";
    updates.slice().reverse().forEach(u=>{
      const div=document.createElement("div"); div.textContent=u; div.style.color=userUIColors.text;
      updateLogs.appendChild(div);
    });
  }

  function genSerialForUser(){ return (userStampHistory.length+1).toString().padStart(5,"0"); }

  renderUserCards();
  updateHistory();
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
  const createCardBtn = document.getElementById("createCardBtn");
  const adminCards = document.getElementById("adminCards");
  const previewArea = document.getElementById("previewArea");
  const previewCardBtn = document.getElementById("previewCardBtn");
  const previewClearBtn = document.getElementById("previewClearBtn");

  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  function renderAdminCards() {
    adminCards.innerHTML="";
    keywordCardSelect.innerHTML="";
    cards.forEach(card=>{
      const li=document.createElement("li");
      const info=document.createElement("div"); info.className="info";
      info.textContent=`${card.name} [枠:${card.slots}]`;
      li.appendChild(info);

      const btns = document.createElement("div"); btns.className="btns";
      const delBtn=document.createElement("button"); delBtn.textContent="削除";
      delBtn.addEventListener("click",()=>{
        if(!confirm("このカードを削除しますか？")) return;
        cards = cards.filter(c=>c.id!==card.id);
        // ユーザー側の履歴も消去
        userStampHistory = userStampHistory.filter(h=>h.cardId!==card.id);
        saveAll(); renderAdminCards();
      });
      btns.appendChild(delBtn);
      li.appendChild(btns);
      adminCards.appendChild(li);

      const option = document.createElement("option"); option.value=card.id; option.textContent=card.name;
      keywordCardSelect.appendChild(option);
    });
  }

  function renderKeywordList() {
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li"); li.textContent=`${cards.find(c=>c.id===k.cardId)?.name||k.cardId} : ${k.word}`;
      const delBtn=document.createElement("button"); delBtn.textContent="削除";
      delBtn.addEventListener("click",()=>{ keywords=keywords.filter(kk=>kk!==k); saveAll(); renderKeywordList(); });
      li.appendChild(delBtn); keywordList.appendChild(li);
    });
  }

  function renderUpdateLogs() {
    adminUpdateLogs.innerHTML="";
    updates.slice().reverse().forEach(u=>{
      const div=document.createElement("div"); div.textContent=u;
      adminUpdateLogs.appendChild(div);
    });
  }

  createCardBtn.addEventListener("click",()=>{
    const name = cardName.value.trim(); if(!name){alert("カード名必須");return;}
    const slots = parseInt(cardSlots.value); if(!slots){alert("枠数必須");return;}
    const pass = addPass.value.trim(); if(!pass){alert("追加パス必須");return;}
    const card={id:Date.now().toString(),name,slots,addPass:pass,notifyMsg:notifyMsg.value,maxNotifyMsg:maxNotifyMsg.value,bg:cardBG.value,stampIcon:stampIcon.value};
    cards.push(card); saveAll(); renderAdminCards(); alert("作成しました");
  });

  previewCardBtn.addEventListener("click",()=>{
    const card={name:cardName.value||"プレビュー",slots:parseInt(cardSlots.value)||5,bg:cardBG.value};
    previewArea.innerHTML="";
    const div=document.createElement("div"); div.className="card"; if(card.bg) div.style.background=card.bg;
    const title=document.createElement("h3"); title.textContent=card.name; div.appendChild(title);
    for(let i=0;i<card.slots;i++){ const s=document.createElement("div"); s.className="stamp-slot"; div.appendChild(s);}
    previewArea.appendChild(div);
  });

  previewClearBtn.addEventListener("click",()=>{ previewArea.innerHTML=""; });

  addKeywordBtn.addEventListener("click",()=>{
    const cardId = keywordCardSelect.value; const word=keywordInput.value.trim();
    if(!cardId || !word){alert("カード選択＆合言葉必須");return;}
    keywords.push({cardId,word,active:true}); saveAll(); renderKeywordList();
    keywordInput.value="";
  });

  addUpdateBtn.addEventListener("click",()=>{
    const text=updateInput.value.trim(); if(!text) return;
    updates.push(text); saveAll(); renderUpdateLogs(); updateInput.value="";
  });

  renderAdminCards(); renderKeywordList(); renderUpdateLogs();
}