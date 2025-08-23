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
  userStampHistory: "userStampHistory",
  userUIColors: "userUIColors"
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
let userUIColors = loadJSON(LS_KEYS.userUIColors, {text:"#c44a7b", bg:"#fff0f5", btn:"#ff99cc"});

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
  } catch(e) { console.error(e); alert("データ保存に失敗しました"); }
}

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* ============================
   ユーザー側
============================ */
function initUser(){
  const setNameBtn = document.getElementById("setNameBtn");
  const userNameInput = document.getElementById("userNameInput");
  const cardTitle = document.getElementById("cardTitle");
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardPass = document.getElementById("addCardPass");
  const userCards = document.getElementById("userCards");
  const historyList = document.getElementById("stampHistory");
  const updateLogs = document.getElementById("updateLogs");

  cardTitle.textContent = userName?`${userName}のスタンプカード`:"スタンプカード";
  userNameInput.value = userName;

  function applyUserColors(){
    document.body.style.color = userUIColors.text;
    document.body.style.background = userUIColors.bg;
    document.querySelectorAll("button").forEach(btn=>{
      btn.style.background = userUIColors.btn;
      btn.style.color = userUIColors.text;
    });
  }
  applyUserColors();

  setNameBtn.addEventListener("click", ()=>{
    const v = userNameInput.value.trim();
    if(!v){ alert("名前を入力してください"); return; }
    userName = v; saveAll();
    cardTitle.textContent = `${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click", ()=>{
    const pass = addCardPass.value.trim();
    if(!pass){ alert("追加パスを入力してください"); return; }
    const card = cards.find(c=>c.addPass===pass);
    if(!card){ alert("カードが存在しません"); return; }
    if(userAddedCards.some(c=>c.id===card.id)){ alert("既に追加済み"); return; }
    userAddedCards.push(card); saveAll(); renderUserCards(); addCardPass.value="";
  });

  /* カード表示 */
  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(card=>{
      const container = document.createElement("div");
      container.className = "card";
      container.style.background = card.bg||"#fff0f5";

      const title = document.createElement("h3");
      title.textContent = card.name;
      container.appendChild(title);

      const grid = document.createElement("div");
      for(let i=0;i<card.slots;i++){
        const slot = document.createElement("div");
        slot.className="stamp-slot";
        if(userStampHistory.some(s=>s.cardId===card.id && s.slot===i)) slot.classList.add("stamp-filled");
        grid.appendChild(slot);
      }
      container.appendChild(grid);

      const btn = document.createElement("button");
      btn.textContent="スタンプを押す";
      btn.style.background=userUIColors.btn;
      btn.style.color=userUIColors.text;
      btn.addEventListener("click", ()=>{
        const idx = userStampHistory.filter(s=>s.cardId===card.id).length;
        if(idx>=card.slots){ alert("満了です"); return; }
        userStampHistory.push({cardId:card.id, slot:idx, date:Date.now()});
        saveAll(); renderUserCards(); renderStampHistory();
      });
      container.appendChild(btn);

      const delBtn = document.createElement("button");
      delBtn.textContent="カード削除";
      delBtn.style.background="#999";
      delBtn.style.color=userUIColors.text;
      delBtn.addEventListener("click", ()=>{
        if(!confirm("本当に削除しますか？履歴も消えます")) return;
        userAddedCards=userAddedCards.filter(c=>c.id!==card.id);
        userStampHistory=userStampHistory.filter(s=>s.cardId!==card.id);
        saveAll(); renderUserCards(); renderStampHistory();
      });
      container.appendChild(delBtn);

      userCards.appendChild(container);
    });
  }

  /* スタンプ履歴 */
  function renderStampHistory(){
    historyList.innerHTML="";
    userStampHistory.forEach(s=>{
      const card = cards.find(c=>c.id===s.cardId);
      if(card){
        const li = document.createElement("li");
        li.textContent=`${card.name} の スタンプ${s.slot+1} (${new Date(s.date).toLocaleString()})`;
        historyList.appendChild(li);
      }
    });
  }

  /* 更新履歴 */
  function renderUpdateLogs(){
    updateLogs.innerHTML="";
    updates.forEach(u=>{
      const div = document.createElement("div");
      div.textContent=u;
      updateLogs.appendChild(div);
    });
  }

  /* カスタマイズ */
  const textColorInput=document.getElementById("textColor");
  const bgColorInput=document.getElementById("bgColor");
  const btnColorInput=document.getElementById("btnColor");

  textColorInput.value=userUIColors.text;
  bgColorInput.value=userUIColors.bg;
  btnColorInput.value=userUIColors.btn;

  function applyColors(){
    userUIColors.text=textColorInput.value;
    userUIColors.bg=bgColorInput.value;
    userUIColors.btn=btnColorInput.value;
    saveAll(); applyUserColors(); renderUserCards();
  }

  textColorInput.addEventListener("input",applyColors);
  bgColorInput.addEventListener("input",applyColors);
  btnColorInput.addEventListener("input",applyColors);

  renderUserCards();
  renderStampHistory();
  renderUpdateLogs();
}

/* ============================
   管理者側
============================ */
function initAdmin(){
  const cardName = document.getElementById("cardName");
  const cardSlots = document.getElementById("cardSlots");
  const addPass = document.getElementById("addPass");
  const notifyMsg = document.getElementById("notifyMsg");
  const maxNotifyMsg = document.getElementById("maxNotifyMsg");
  const cardBG = document.getElementById("cardBG");
  const stampIcon = document.getElementById("stampIcon");

  const previewArea = document.getElementById("previewArea");
  const previewCardBtn = document.getElementById("previewCardBtn");
  const previewClearBtn = document.getElementById("previewClearBtn");
  const createCardBtn = document.getElementById("createCardBtn");
  const adminCards = document.getElementById("adminCards");

  function renderAdminCards(){
    adminCards.innerHTML="";
    cards.forEach(card=>{
      const li = document.createElement("li");

      const info = document.createElement("div");
      info.className="info";
      info.textContent=`${card.name} | ${card.addPass} |`;
      li.appendChild(info);

      const btns = document.createElement("div");
      btns.className="btns";

      const previewBtn = document.createElement("button");
      previewBtn.textContent="プレビュー";
      previewBtn.addEventListener("click",()=>previewCard(card));
      btns.appendChild(previewBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        if(!confirm("本当に削除しますか？")) return;
        cards=cards.filter(c=>c.id!==card.id);
        userAddedCards=userAddedCards.filter(c=>c.id!==card.id);
        userStampHistory=userStampHistory.filter(s=>s.cardId!==card.id);
        saveAll(); renderAdminCards(); previewArea.innerHTML="";
      });
      btns.appendChild(delBtn);

      li.appendChild(btns);
      adminCards.appendChild(li);
    });
  }

  function previewCard(card){
    previewArea.innerHTML="";
    const container = document.createElement("div");
    container.className="card";
    container.style.background=card.bg||"#fff0f5";

    const title = document.createElement("h3");
    title.textContent=card.name;
    container.appendChild(title);

    const grid=document.createElement("div");
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div");
      slot.className="stamp-slot";
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    previewArea.appendChild(container);
  }

  previewCardBtn.addEventListener("click",()=>{
    const card={name:cardName.value, slots:Number(cardSlots.value), addPass:addPass.value, bg:cardBG.value};
    previewCard(card);
  });
  previewClearBtn.addEventListener("click",()=>{previewArea.innerHTML="";});

  createCardBtn.addEventListener("click",()=>{
    if(!cardName.value.trim()){ alert("カード名を入力"); return; }
    if(!addPass.value.trim()){ alert("追加パスを入力"); return; }
    const card={id:Date.now(), name:cardName.value, slots:Number(cardSlots.value), addPass:addPass.value, bg:cardBG.value};
    cards.push(card); saveAll(); renderAdminCards();
  });

  renderAdminCards();
}