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
let userUIColors = loadJSON(LS_KEYS.userUIColors, {text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});

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

/* =========================
   ユーザー画面
   ========================= */
function initUser() {
  const userCardsDiv = document.getElementById("userCards");
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardPass = document.getElementById("addCardPass");
  const stampHistory = document.getElementById("stampHistory");
  const updateLogs = document.getElementById("updateLogs");
  const userNameInput = document.getElementById("userNameInput");
  const setNameBtn = document.getElementById("setNameBtn");

  const textColorInp = document.getElementById("textColor");
  const bgColorInp = document.getElementById("bgColor");
  const btnColorInp = document.getElementById("btnColor");

  function renderUserCards() {
    userCardsDiv.innerHTML="";
    userAddedCards.forEach(uc=>{
      const card=cards.find(c=>c.id===uc.cardId);
      if(!card) return;
      const div=document.createElement("div"); div.className="card"; if(card.bg) div.style.background=card.bg;
      const title=document.createElement("h3"); title.textContent=card.name; div.appendChild(title);
      for(let i=0;i<card.slots;i++){
        const s=document.createElement("div"); s.className="stamp-slot";
        if(uc.stamps && uc.stamps.includes(i)) s.classList.add("stamp-filled");
        div.appendChild(s);
      }
      const delBtn=document.createElement("button"); delBtn.textContent="削除";
      delBtn.style.background=userUIColors.btn; delBtn.style.color="#fff";
      delBtn.addEventListener("click",()=>{
        if(!confirm("カードを削除しますか？")) return;
        userAddedCards=userAddedCards.filter(x=>x!==uc);
        userStampHistory=userStampHistory.filter(h=>h.cardId!==uc.cardId);
        saveAll(); renderUserCards(); renderStampHistory();
      });
      div.appendChild(delBtn);
      userCardsDiv.appendChild(div);
    });
  }

  function renderStampHistory() {
    stampHistory.innerHTML="";
    userStampHistory.forEach(h=>{
      const li=document.createElement("li");
      li.textContent=`カード: ${cards.find(c=>c.id===h.cardId)?.name||h.cardId} スタンプ: ${h.slot+1}`;
      li.style.color=userUIColors.text;
      stampHistory.appendChild(li);
    });
  }

  function renderUpdateLogs() {
    updateLogs.innerHTML="";
    updates.slice().reverse().forEach(u=>{
      const div=document.createElement("div"); div.textContent=u; div.style.color=userUIColors.text;
      updateLogs.appendChild(div);
    });
  }

  addCardBtn.addEventListener("click",()=>{
    const pass = addCardPass.value.trim();
    const card=cards.find(c=>c.addPass===pass);
    if(!card){ alert("追加パスが存在しません"); return; }
    if(userAddedCards.some(uc=>uc.cardId===card.id)){ alert("すでに追加済み"); return; }
    userAddedCards.push({cardId:card.id,stamps:[]});
    saveAll(); renderUserCards(); addCardPass.value="";
  });

  setNameBtn.addEventListener("click",()=>{
    userName=userNameInput.value.trim();
    saveAll();
  });

  // カラー設定
  function applyColors(){
    document.body.style.color=userUIColors.text;
    document.body.style.background=userUIColors.bg;
    document.querySelectorAll("button").forEach(b=>{
      b.style.background=userUIColors.btn;
      b.style.color="#fff";
    });
  }

  textColorInp.addEventListener("input",()=>{
    userUIColors.text=textColorInp.value; saveAll(); applyColors();
  });
  bgColorInp.addEventListener("input",()=>{
    userUIColors.bg=bgColorInp.value; saveAll(); applyColors();
  });
  btnColorInp.addEventListener("input",()=>{
    userUIColors.btn=btnColorInp.value; saveAll(); applyColors();
  });

  applyColors();
  renderUserCards(); renderStampHistory(); renderUpdateLogs();
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
      info.textContent=`${card.name} | ${card.addPass}`;
      li.appendChild(info);

      const btns = document.createElement("div"); btns.className="btns";

      const previewBtn = document.createElement("button"); previewBtn.textContent="プレビュー";
      previewBtn.addEventListener("click",()=>{
        previewArea.innerHTML="";
        const div=document.createElement("div"); div.className="card"; if(card.bg) div.style.background=card.bg;
        const title=document.createElement("h3"); title.textContent=card.name; div.appendChild(title);
        for(let i=0;i<card.slots;i++){ const s=document.createElement("div"); s.className="stamp-slot"; div.appendChild(s);}
        previewArea.appendChild(div);
      });
      btns.appendChild(previewBtn);

      const delBtn=document.createElement("button"); delBtn.textContent="削除";
      delBtn.addEventListener("click",()=>{
        if(!confirm("このカードを削除しますか？")) return;
        cards = cards.filter(c=>c.id!==card.id);
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