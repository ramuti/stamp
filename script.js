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
  userUIColors: "userUIColors",
  userCardSerials: "userCardSerials"
};

const APP_VERSION = "v1.3.0";

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
}
function saveJSON(key,obj){ localStorage.setItem(key,JSON.stringify(obj)); }

let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);
let userUIColors = loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials = loadJSON(LS_KEYS.userCardSerials,{});

function saveAll(){
  try{
    localStorage.setItem(LS_KEYS.userName,userName);
    saveJSON(LS_KEYS.cards,cards);
    saveJSON(LS_KEYS.keywords,keywords);
    saveJSON(LS_KEYS.updates,updates);
    saveJSON(LS_KEYS.userAddedCards,userAddedCards);
    saveJSON(LS_KEYS.userStampHistory,userStampHistory);
    saveJSON(LS_KEYS.userUIColors,userUIColors);
    saveJSON(LS_KEYS.userCardSerials,userCardSerials);
    localStorage.setItem(LS_KEYS.appVersion,APP_VERSION);
  } catch(e){ alert("データ保存に失敗"); console.error(e); }
}

document.addEventListener("DOMContentLoaded",()=>{
  const body = document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* =========================
   ユーザー画面
   ========================= */
function initUser(){
  // ユーザ画面初期化
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

  setNameBtn.addEventListener("click",()=>{
    const v=userNameInput.value.trim();
    if(!v){alert("名前を入力してください"); return;}
    userName=v;
    saveAll();
    cardTitle.textContent = `${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click",()=>{
    const pass=addCardPass.value.trim();
    if(!pass){alert("追加パスを入力してください"); return;}
    const card=cards.find(c=>c.addPass===pass);
    if(!card){alert("パスが違います"); return;}
    if(!userAddedCards.includes(card.id)){
      userAddedCards.push(card.id);
      if(!userCardSerials[userName]) userCardSerials[userName]={};
      if(!userCardSerials[userName][card.id]){
        const existingSerials=Object.values(userCardSerials).map(u=>u[card.id]||0);
        const maxSerial=existingSerials.length?Math.max(...existingSerials):0;
        userCardSerials[userName][card.id]=maxSerial+1;
      }
      saveAll();
      renderUserCards();
      addCardPass.value="";
    } else alert("すでに追加済みです");
  });

  [textColorPicker,bgColorPicker,btnColorPicker].forEach(p=>{
    p.addEventListener("input",()=>{
      userUIColors.text=textColorPicker.value;
      userUIColors.bg=bgColorPicker.value;
      userUIColors.btn=btnColorPicker.value;
      saveAll();
      applyUserColors();
    });
  });

  function applyUserColors(){
    document.body.style.background=userUIColors.bg;
    document.body.style.color=userUIColors.text;
    cardTitle.style.color=userUIColors.text;
    document.querySelectorAll("button").forEach(btn=>{
      btn.style.background=userUIColors.btn;
      btn.style.color=userUIColors.text;
    });
  }

  // 存在しないカードのスタンプ履歴を削除
  userStampHistory = userStampHistory.filter(s=>cards.find(c=>c.id===s.cardId));

  function renderUserCard(card){
    const container=document.createElement("div");
    container.className="card";
    container.dataset.id=card.id;
    if(card.bg) container.style.background=card.bg;

    const title=document.createElement("h3");
    title.textContent=card.name;
    container.appendChild(title);

    const grid=document.createElement("div");
    grid.style.marginBottom="8px";
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div");
      slot.className="stamp-slot";
      if(userStampHistory.some(s=>s.cardId===card.id && s.slot===i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial=document.createElement("div");
    serial.className="serial";
    serial.textContent=`No.${userCardSerials[userName][card.id]||0}`;
    container.appendChild(serial);

    const btn=document.createElement("button");
    btn.textContent="スタンプを押す";
    btn.style.marginTop="8px";
    btn.addEventListener("click",()=>{
      const kw=prompt("スタンプ合言葉を入力してください");
      if(kw===null) return;
      const word=kw.trim();
      if(!word){alert("合言葉を入力してください"); return;}
      const keywordObj=keywords.find(k=>String(k.cardId)===String(card.id) && k.word===word);
      if(!keywordObj){
        alert("合言葉が違います");
        return;
      }
      if(!keywordObj.enabled){
        alert("この合言葉は無効です");
        return;
      }
      const nextSlot=userStampHistory.filter(s=>s.cardId===card.id).length;
      if(nextSlot>=card.slots){alert("すでにMAXです"); return;}
      userStampHistory.push({cardId:card.id,slot:nextSlot});
      saveAll();
      renderUserCards();
      renderHistory();
    });
    container.appendChild(btn);

    return container;
  }

  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(id=>{
      const card=cards.find(c=>c.id===id);
      if(card) userCards.appendChild(renderUserCard(card));
    });
  }

  function renderHistory(){
    historyList.innerHTML="";
    userStampHistory.forEach(s=>{
      const card=cards.find(c=>c.id===s.cardId);
      if(!card) return; // 存在しないカードの履歴は無視
      const li=document.createElement("li");
      li.textContent=`${card.name} スタンプ${s.slot+1}`;
      historyList.appendChild(li);
    });
  }

  function renderUpdates(){
    updateLogs.innerHTML="";
    updates.forEach(u=>{
      const li=document.createElement("li");
      li.textContent=`${u.date} ${u.msg}`;
      updateLogs.appendChild(li);
    });
  }

  renderUserCards();
  renderHistory();
  renderUpdates();
}