/* ============================
   script.js — 管理者・ユーザー 共通
   仕様は完全に維持
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

const APP_VERSION = "v1.7.0";

/* ヘルパー関数 */
function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
}
function saveJSON(key,obj){ localStorage.setItem(key,JSON.stringify(obj)); }

/* マージ系 */
function mergeUniqueArray(existing,newArr){ const set=new Set(existing||[]); (newArr||[]).forEach(v=>set.add(v)); return Array.from(set); }
function mergeStampHistories(existing,current){ 
  const map=new Map(); (existing||[]).forEach(e=>map.set(`${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`,e));
  (current||[]).forEach(e=>map.set(`${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`,e));
  return Array.from(map.values());
}
function mergeUserCardSerials(existing,current){
  const merged=JSON.parse(JSON.stringify(existing||{}));
  for(const user in (current||{})){ 
    if(!merged[user]) merged[user]={};
    for(const cid in current[user]){
      if(merged[user][cid]===undefined||merged[user][cid]===null) merged[user][cid]=current[user][cid];
    }
  }
  return merged;
}

/* 保存 */
function saveAll(){
  try{
    localStorage.setItem(LS_KEYS.appVersion,APP_VERSION);
    localStorage.setItem(LS_KEYS.userName,userName);
    saveJSON(LS_KEYS.cards,cards);
    saveJSON(LS_KEYS.keywords,keywords);
    saveJSON(LS_KEYS.updates,updates);

    const mergedUserAdded=mergeUniqueArray(loadJSON(LS_KEYS.userAddedCards,[]),userAddedCards);
    saveJSON(LS_KEYS.userAddedCards,mergedUserAdded);
    userAddedCards=mergedUserAdded;

    const mergedHistory=mergeStampHistories(loadJSON(LS_KEYS.userStampHistory,[]),userStampHistory);
    saveJSON(LS_KEYS.userStampHistory,mergedHistory);
    userStampHistory=mergedHistory;

    const mergedSerials=mergeUserCardSerials(loadJSON(LS_KEYS.userCardSerials,{}),userCardSerials);
    saveJSON(LS_KEYS.userCardSerials,mergedSerials);
    userCardSerials=mergedSerials;

    const mergedColors=Object.assign({},loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"}),userUIColors||{});
    saveJSON(LS_KEYS.userUIColors,mergedColors);
    userUIColors=mergedColors;
  }catch(e){ console.error(e); alert("データ保存失敗"); }
}

/* グローバル状態 */
let userName = localStorage.getItem(LS_KEYS.userName)||"";
let cards = loadJSON(LS_KEYS.cards,[]);
let keywords = loadJSON(LS_KEYS.keywords,[]);
let updates = loadJSON(LS_KEYS.updates,[]);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards,[]);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory,[]);
let userUIColors = loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials = loadJSON(LS_KEYS.userCardSerials,{});

/* =========================
   DOM準備
========================= */
document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* =========================
   ユーザー画面
========================= */
function initUser(){
  const userCards = document.getElementById("userCards");
  const addCardPass = document.getElementById("addCardPass");
  const addCardBtn = document.getElementById("addCardBtn");

  addCardBtn.addEventListener("click",()=>{
    const pass = addCardPass.value.trim(); if(!pass){ alert("追加パス入力"); return; }
    const card = cards.find(c=>c.addPass===pass);
    if(!card){ alert("パス違い"); return; }
    if(userAddedCards.includes(card.id)){ alert("すでに追加済み"); return; }

    userAddedCards.push(card.id);
    if(!userCardSerials[userName]) userCardSerials[userName]={};
    if(!userCardSerials[userName][card.id]) userCardSerials[userName][card.id]=Math.floor(Math.random()*1000)+1;

    saveAll(); addCardPass.value=""; renderUserCards();
  });

  function renderUserCard(card){
    const div=document.createElement("div"); div.className="card"; div.style.background=card.bg||"#fff0f5";
    const h3=document.createElement("h3"); h3.textContent=card.name; div.appendChild(h3);
    const serial = document.createElement("div"); serial.textContent=`No.${userCardSerials[userName][card.id]||0}`; div.appendChild(serial);

    const grid=document.createElement("div"); grid.style.margin="6px 0";
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div"); slot.className="stamp-slot";
      if(userStampHistory.some(s=>s.cardId===card.id && s.slot===i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    div.appendChild(grid);

    const btn=document.createElement("button"); btn.textContent="スタンプ押す";
    btn.addEventListener("click",()=>{
      const kw = prompt("合言葉入力"); if(!kw) return;
      const word=kw.trim();
      const kobj = keywords.find(k=>k.cardId===card.id && k.word===word);
      if(!kobj){ alert("合言葉違い"); return; }
      if(!kobj.enabled){ alert("無効"); return; }
      if(userStampHistory.some(s=>s.cardId===card.id && s.word===word)){ alert("使用済"); return; }
      const slot=userStampHistory.filter(s=>s.cardId===card.id).length;
      userStampHistory.push({cardId:card.id,slot:slot,word:word,datetime:new Date().toISOString()});
      saveAll(); renderUserCards(); alert("スタンプ押しました");
    });
    div.appendChild(btn);

    return div;
  }

  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(cid=>{
      const card=cards.find(c=>c.id===cid); if(card) userCards.appendChild(renderUserCard(card));
    });
  }
  renderUserCards();
}

/* =========================
   管理者画面
========================= */
function initAdmin(){
  const cardName = document.getElementById("cardName");
  const cardSlots = document.getElementById("cardSlots");
  const addPass = document.getElementById("addPass");
  const notifyMsg = document.getElementById("notifyMsg");
  const maxNotifyMsg = document.getElementById("maxNotifyMsg");
  const cardBG = document.getElementById("cardBG");
  const stampIcon = document.getElementById("stampIcon");

  const previewCardBtn = document.getElementById("previewCardBtn");
  const previewClearBtn = document.getElementById("previewClearBtn");
  const createCardBtn = document.getElementById("createCardBtn");
  const adminCardsList = document.getElementById("adminCards");

  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const updateList = document.getElementById("adminUpdateLogs");

  /* カードプレビュー */
  previewCardBtn.addEventListener("click",()=>{
    const name=cardName.value.trim();
    const slots=Number(cardSlots.value)||5;
    const bg=cardBG.value||"#fff0f5";
    const container=document.getElementById("previewArea");
    container.innerHTML="";
    const div=document.createElement("div"); div.className="card"; div.style.background=bg;
    const h3=document.createElement("h3"); h3.textContent=name; div.appendChild(h3);
    const grid=document.createElement("div"); for(let i=0;i<slots;i++){ const slot=document.createElement("div"); slot.className="stamp-slot"; grid.appendChild(slot); }
    div.appendChild(grid);
    if(stampIcon.value){ const img=document.createElement("img"); img.src=stampIcon.value; img.style.width="24px"; img.style.height="24px"; div.appendChild(img);}
    container.appendChild(div);
  });
  previewClearBtn.addEventListener("click",()=>{ document.getElementById("previewArea").innerHTML=""; });

  /* カード作成 */
  createCardBtn.addEventListener("click",()=>{
    const name=cardName.value.trim(); if(!name){ alert("カード名"); return; }
    const slots=Number(cardSlots.value)||5;
    const pass=addPass.value.trim(); if(!pass){ alert("追加パス"); return; }
    const newCard={id:Date.now(),name:name,slots:slots,addPass:pass,bg:cardBG.value,stampIcon:stampIcon.value,notifyMsg:notifyMsg.value,maxNotifyMsg:maxNotifyMsg.value};
    cards.push(newCard); saveAll(); renderAdminCards();
  });

  /* カード一覧表示 */
  function renderAdminCards(){
    adminCardsList.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      const info=document.createElement("span"); info.textContent=`${c.name} \\ ${c.addPass}`;
      li.appendChild(info);
      const delBtn=document.createElement("button"); delBtn.textContent="消去"; delBtn.addEventListener("click",()=>{ cards=cards.filter(x=>x.id!==c.id); saveAll(); renderAdminCards(); });
      li.appendChild(delBtn);
      adminCardsList.appendChild(li);
    });

    // キーワード用セレクト
    keywordCardSelect.innerHTML=""; cards.forEach(c=>{ const opt=document.createElement("option"); opt.value=c.id; opt.textContent=c.name; keywordCardSelect.appendChild(opt); });
    renderKeywords();
  }
  renderAdminCards();

  /* キーワード表示 */
  addKeywordBtn.addEventListener("click",()=>{
    const cardId=Number(keywordCardSelect.value);
    const word=keywordInput.value.trim(); if(!word) return;
    keywords.push({cardId:cardId,word:word,enabled:true}); saveAll(); keywordInput.value=""; renderKeywords();
  });

  function renderKeywords(){
    keywordList.innerHTML="";
    keywords.forEach((k,i)=>{
      const li=document.createElement("li");
      const card=cards.find(c=>c.id===k.cardId);
      li.textContent=`${card?card.name:"Unknown"} ${k.word} `;
      const toggleBtn=document.createElement("button"); toggleBtn.textContent=k.enabled?"有効":"無効";
      toggleBtn.addEventListener("click",()=>{ k.enabled=!k.enabled; saveAll(); renderKeywords(); });
      li.appendChild(toggleBtn);
      const delBtn=document.createElement("button"); delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{ keywords.splice(i,1); saveAll(); renderKeywords(); });
      li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }

  /* 更新履歴追加 */
  addUpdateBtn.addEventListener("click",()=>{
    const val=updateInput.value.trim(); if(!val) return;
    updates.push({text:val,datetime:new Date().toISOString()});
    saveAll(); updateInput.value=""; renderUpdates();
  });

  /* 更新履歴表示 */
  function renderUpdates(){
    updateList.innerHTML="";
    updates.forEach((u,i)=>{
      const li=document.createElement("li");
      li.textContent=`${u.text}`;
      const delBtn=document.createElement("button"); delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{ updates.splice(i,1); saveAll(); renderUpdates(); });
      li.appendChild(delBtn);
      updateList.appendChild(li);
    });
  }
  renderUpdates();

  /* コピー用ボタン */
  if(!document.getElementById("copyUpdateDataBtn")){
    const container=document.createElement("div"); container.style.margin="16px 0"; container.style.textAlign="center";
    const btn=document.createElement("button"); btn.id="copyUpdateDataBtn"; btn.textContent="カード・合言葉データをコピー";
    btn.addEventListener("click",()=>{ navigator.clipboard.writeText(generateUpdateData()).then(()=>alert("コピーしました！ updateDataFull.js に貼り付けてください")).catch(err=>alert(err)); });
    container.appendChild(btn); document.body.appendChild(container);
  }

  function generateUpdateData(){
    return JSON.stringify({cards:cards.map(c=>({id:c.id,name:c.name,slots:c.slots,addPass:c.addPass,bg:c.bg,stampIcon:c.stampIcon,notifyMsg:c.notifyMsg,maxNotifyMsg:c.maxNotifyMsg})),keywords:keywords.map(k=>({cardId:k.cardId,word:k.word,enabled:k.enabled}))},null,2);
  }
}