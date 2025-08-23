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

/* load / save helper */
function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
}
function saveJSON(key,obj){ localStorage.setItem(key,JSON.stringify(obj)); }

/* app state */
let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards,[]);
let keywords = loadJSON(LS_KEYS.keywords,[]);
let updates = loadJSON(LS_KEYS.updates,[]);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards,[]);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory,[]);

/* save all */
function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.userName,userName);
    saveJSON(LS_KEYS.cards,cards);
    saveJSON(LS_KEYS.keywords,keywords);
    saveJSON(LS_KEYS.updates,updates);
    saveJSON(LS_KEYS.userAddedCards,userAddedCards);
    saveJSON(LS_KEYS.userStampHistory,userStampHistory);
    localStorage.setItem(LS_KEYS.appVersion,APP_VERSION);
  } catch(e){ alert("データ保存に失敗しました"); console.error(e); }
}

/* DOM ready init */
document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* ============================
   ユーザー側
   ============================ */
function initUser(){
  const setNameBtn=document.getElementById("setNameBtn");
  const userNameInput=document.getElementById("userNameInput");
  const cardTitle=document.getElementById("cardTitle");
  const addCardBtn=document.getElementById("addCardBtn");
  const addCardPass=document.getElementById("addCardPass");
  const userCards=document.getElementById("userCards");
  const historyList=document.getElementById("stampHistory");
  const updateLogs=document.getElementById("updateLogs");

  cardTitle.textContent = userName ? `${userName}のスタンプカード`:"スタンプカード";
  userNameInput.value=userName;

  setNameBtn.addEventListener("click",()=>{
    const v=userNameInput.value.trim();
    if(!v){ alert("名前を入力してください"); return; }
    userName=v;
    saveAll();
    cardTitle.textContent=`${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click",()=>{
    const pass=addCardPass.value.trim();
    if(!pass){ alert("追加パスを入力してください"); return; }
    const card=cards.find(c=>c.addPass===pass);
    if(!card){ alert("パスが間違っています"); return; }
    if(!userAddedCards.includes(card.id)){
      userAddedCards.push(card.id);
      saveJSON(LS_KEYS.userAddedCards,userAddedCards);
      renderUserCards();
      addCardPass.value="";
    } else { alert("すでに追加済みです"); }
  });

  function renderUserCard(card){
    const container=document.createElement("div");
    container.className="card";
    if(card.bg) container.style.background=card.bg;
    container.dataset.id=card.id;

    const title=document.createElement("h3");
    title.textContent=card.name;
    container.appendChild(title);

    const grid=document.createElement("div"); grid.style.marginBottom="8px";
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div");
      slot.className="stamp-slot";
      if(userStampHistory.some(s=>s.cardId===card.id && s.slot===i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    container.appendChild(grid);

    const serial=document.createElement("div");
    serial.className="serial";
    serial.textContent=genSerialForUser();
    container.appendChild(serial);

    const btn=document.createElement("button");
    btn.textContent="スタンプを押す";
    btn.style.marginTop="8px";
    btn.addEventListener("click",()=>{
      const kw=prompt("スタンプ合言葉を入力してください"); if(kw===null) return;
      const word=kw.trim(); if(!word){ alert("合言葉を入力してください"); return; }
      const keywordObj=keywords.find(k=>String(k.cardId)===String(card.id)&&k.word===word);
      if(!keywordObj){ alert("合言葉が間違っています"); return; }
      const nextSlot=userStampHistory.filter(s=>s.cardId===card.id).length;
      if(nextSlot>=card.slots){ alert("すでに最大枠です"); return; }
      userStampHistory.push({cardId:card.id,slot:nextSlot});
      saveJSON(LS_KEYS.userStampHistory,userStampHistory);
      renderUserCards();
    });
    container.appendChild(btn);

    return container;
  }

  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(cid=>{
      const c=cards.find(c=>c.id===cid);
      if(c) userCards.appendChild(renderUserCard(c));
    });
  }

  renderUserCards();

  /* 更新履歴 */
  function renderUpdateLogs(){
    updateLogs.innerHTML="";
    updates.forEach(u=>{
      const d=document.createElement("div"); d.textContent=u; updateLogs.appendChild(d);
    });
  }
  renderUpdateLogs();
}

function genSerialForUser(){
  return "SC-"+Math.random().toString(36).substr(2,8).toUpperCase();
}

/* ============================
   管理者側
   ============================ */
function initAdmin(){
  const cardName=document.getElementById("cardName");
  const cardSlots=document.getElementById("cardSlots");
  const addPassInput=document.getElementById("addPass");
  const notifyMsgInput=document.getElementById("notifyMsg");
  const maxNotifyInput=document.getElementById("maxNotifyMsg");
  const stampIconInput=document.getElementById("stampIcon");
  const createBtn=document.getElementById("createCardBtn");
  const adminCards=document.getElementById("adminCards");
  const previewArea=document.getElementById("previewArea");
  const cardBGPicker=document.getElementById("cardBGPicker");

  const keywordCardSelect=document.getElementById("keywordCardSelect");
  const keywordInput=document.getElementById("keywordInput");
  const addKeywordBtn=document.getElementById("addKeywordBtn");
  const keywordList=document.getElementById("keywordList");

  const updateInput=document.getElementById("updateInput");
  const addUpdateBtn=document.getElementById("addUpdateBtn");
  const adminUpdateLogs=document.getElementById("adminUpdateLogs");

  let selectedBG="#fff0f5";

  cardBGPicker.addEventListener("click",()=>{
    const color=prompt("背景色コードを入力してください (例:#fff0f5)"); 
    if(color){ selectedBG=color; cardBGPicker.style.background=color; }
  });

  function renderAdminCards(){
    adminCards.innerHTML="";
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      li.style.display="flex"; li.style.justifyContent="space-between"; li.style.alignItems="center";

      const nameSpan=document.createElement("span");
      nameSpan.textContent=c.name; li.appendChild(nameSpan);

      const pathSpan=document.createElement("span");
      pathSpan.textContent=c.addPass; li.appendChild(pathSpan);

      const previewBtn=document.createElement("button");
      previewBtn.textContent="プレビュー";
      previewBtn.addEventListener("click",()=>{ renderPreview(c); });
      li.appendChild(previewBtn);

      const delBtn=document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        if(confirm("削除しますか？")){ cards=cards.filter(x=>x.id!==c.id); saveJSON(LS_KEYS.cards,cards); renderAdminCards(); previewArea.innerHTML=""; }
      });
      li.appendChild(delBtn);

      adminCards.appendChild(li);

      /* keyword select */
      const opt=document.createElement("option");
      opt.value=c.id; opt.textContent=c.name; keywordCardSelect.appendChild(opt);
    });
  }

  function renderPreview(card){
    previewArea.innerHTML="";
    const container=document.createElement("div");
    container.className="card"; container.style.background=card.bg;

    const title=document.createElement("h3"); title.textContent=card.name; container.appendChild(title);
    const grid=document.createElement("div"); grid.style.marginBottom="8px";
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div"); slot.className="stamp-slot"; grid.appendChild(slot);
    }
    container.appendChild(grid);

    previewArea.appendChild(container);
  }

  createBtn.addEventListener("click",()=>{
    const name=cardName.value.trim();
    const slots=parseInt(cardSlots.value);
    const addPass=addPassInput.value.trim();
    const notify=notifyMsgInput.value.trim();
    const maxNotify=maxNotifyInput.value.trim();
    const stampIcon=stampIconInput.value.trim();
    if(!name||!slots||!addPass){ alert("名前、枠数、追加パスは必須です"); return; }
    const id=Date.now();
    const newCard={id,name,slots,addPass,bg:selectedBG,notifyMsg:notify,maxNotifyMsg:maxNotify,stampIcon};
    cards.push(newCard);
    saveJSON(LS_KEYS.cards,cards);
    renderAdminCards();
    renderPreview(newCard);

    cardName.value=""; cardSlots.value=5; addPassInput.value=""; notifyMsgInput.value=""; maxNotifyInput.value=""; stampIconInput.value="";
  });

  /* キーワード管理 */
  addKeywordBtn.addEventListener("click",()=>{
    const cardId=keywordCardSelect.value;
    const word=keywordInput.value.trim();
    if(!cardId||!word){ alert("カードと合言葉を入力してください"); return; }
    keywords.push({cardId,word});
    saveJSON(LS_KEYS.keywords,keywords);
    renderKeywords();
    keywordInput.value="";
  });

  function renderKeywords(){
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      const cardName=cards.find(c=>c.id==k.cardId)?.name || "不明";
      li.textContent=`${cardName} - ${k.word}`;
      const del=document.createElement("button"); del.textContent="消去";
      del.addEventListener("click",()=>{ keywords=keywords.filter(x=>x!==k); saveJSON(LS_KEYS.keywords,keywords); renderKeywords(); });
      li.appendChild(del);
      keywordList.appendChild(li);
    });
  }

  renderAdminCards();
  renderKeywords();

  /* 更新履歴 */
  addUpdateBtn.addEventListener("click",()=>{
    const v=updateInput.value.trim(); if(!v){ alert("内容を入力してください"); return; }
    updates.push(v);
    saveJSON(LS_KEYS.updates,updates);
    renderUpdateLogs();
    updateInput.value="";
  });

  function renderUpdateLogs(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const d=document.createElement("div"); d.textContent=u; adminUpdateLogs.appendChild(d);
    });
  }

  renderUpdateLogs();
}