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

function loadJSON(key, fallback){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; } catch(e){ return fallback; } }
function saveJSON(key,obj){ localStorage.setItem(key,JSON.stringify(obj)); }

let userName = localStorage.getItem(LS_KEYS.userName)||"";
let cards = loadJSON(LS_KEYS.cards,[]);
let keywords = loadJSON(LS_KEYS.keywords,[]);
let updates = loadJSON(LS_KEYS.updates,[]);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards,[]);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory,[]);

function saveAll(){
  try{
    localStorage.setItem(LS_KEYS.userName,userName);
    saveJSON(LS_KEYS.cards,cards);
    saveJSON(LS_KEYS.keywords,keywords);
    saveJSON(LS_KEYS.updates,updates);
    saveJSON(LS_KEYS.userAddedCards,userAddedCards);
    saveJSON(LS_KEYS.userStampHistory,userStampHistory);
    localStorage.setItem(LS_KEYS.appVersion,APP_VERSION);
  }catch(e){ alert("データ保存に失敗しました。"); console.error(e);}
}

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

  const textColorPicker=document.getElementById("textColorPicker");
  const bgColorPicker=document.getElementById("bgColorPicker");
  const btnColorPicker=document.getElementById("btnColorPicker");

  cardTitle.textContent = userName?`${userName}のスタンプカード`:"スタンプカード";
  userNameInput.value = userName;

  setNameBtn.addEventListener("click",()=>{
    const v=userNameInput.value.trim();
    if(!v){ alert("名前を入力してください"); return; }
    userName=v; saveAll();
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
      renderUserCards(); addCardPass.value="";
    } else { alert("すでに追加済みです"); }
  });

  function renderUserCard(card){
    const container=document.createElement("div");
    container.className="card";
    container.dataset.id=card.id;
    const title=document.createElement("h3"); title.textContent=card.name; container.appendChild(title);
    const grid=document.createElement("div"); grid.style.marginBottom="8px";
    for(let i=0;i<card.slots;i++){
      const slot=document.createElement("div"); slot.className="stamp-slot";
      if(userStampHistory.some(s=>s.cardId===card.id&&s.slot===i)) slot.classList.add("stamp-filled");
      grid.appendChild(slot);
    }
    container.appendChild(grid);
    return container;
  }

  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(id=>{
      const card=cards.find(c=>c.id===id);
      if(!card) return;
      userCards.appendChild(renderUserCard(card));
    });
  }

  function renderUpdates(){
    updateLogs.innerHTML="";
    updates.forEach(u=>{
      const d=document.createElement("div"); d.textContent=u; updateLogs.appendChild(d);
    });
  }

  renderUserCards(); renderUpdates();

  /* カラー変更 */
  textColorPicker.addEventListener("input",()=>{ document.body.style.color=textColorPicker.value; });
  bgColorPicker.addEventListener("input",()=>{ document.body.style.backgroundColor=bgColorPicker.value; });
  btnColorPicker.addEventListener("input",()=>{
    document.querySelectorAll("button").forEach(b=>b.style.backgroundColor=btnColorPicker.value);
  });
}

/* ============================
   管理者側
   ============================ */
function initAdmin(){
  const cardName=document.getElementById("cardName");
  const cardSlots=document.getElementById("cardSlots");
  const addPass=document.getElementById("addPass");
  const notifyMsg=document.getElementById("notifyMsg");
  const maxNotifyMsg=document.getElementById("maxNotifyMsg");
  const cardBG=document.getElementById("cardBG");
  const stampIcon=document.getElementById("stampIcon");
  const createCardBtn=document.getElementById("createCardBtn");
  const previewClearBtn=document.getElementById("previewClearBtn");

  const adminCards=document.getElementById("adminCards");
  const keywordCardSelect=document.getElementById("keywordCardSelect");
  const keywordInput=document.getElementById("keywordInput");
  const addKeywordBtn=document.getElementById("addKeywordBtn");
  const keywordList=document.getElementById("keywordList");
  const updateInput=document.getElementById("updateInput");
  const addUpdateBtn=document.getElementById("addUpdateBtn");
  const adminUpdateLogs=document.getElementById("adminUpdateLogs");
  const previewArea=document.getElementById("previewArea");

  function refreshCardListUI(){
    adminCards.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      const nameSpan=document.createElement("span"); nameSpan.textContent=c.name; li.appendChild(nameSpan);
      const addPassSpan=document.createElement("span"); addPassSpan.textContent=c.addPass; li.appendChild(addPassSpan);
      const previewBtn=document.createElement("button"); previewBtn.textContent="プレビュー";
      previewBtn.addEventListener("click",()=>{ previewArea.innerHTML=""; previewArea.appendChild(renderCardPreview(c)); });
      li.appendChild(previewBtn);
      const delBtn=document.createElement("button"); delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        if(confirm("削除しますか？")){
          cards=cards.filter(x=>x.id!==c.id);
          saveJSON(LS_KEYS.cards,cards);
          userAddedCards=userAddedCards.filter(id=>id!==c.id);
          userStampHistory=userStampHistory.filter(s=>s.cardId!==c.id);
          saveAll(); refreshCardListUI(); renderKeywords(); renderUpdates();
        }
      });
      li.appendChild(delBtn);
      adminCards.appendChild(li);
    });
  }

  function renderCardPreview(c){
    const container=document.createElement("div");
    container.className="card";
    const title=document.createElement("h3"); title.textContent=c.name; container.appendChild(title);
    for(let i=0;i<c.slots;i++){
      const slot=document.createElement("div"); slot.className="stamp-slot"; container.appendChild(slot);
    }
    return container;
  }

  createCardBtn.addEventListener("click",()=>{
    const name=cardName.value.trim();
    const slots=parseInt(cardSlots.value)||5;
    const pass=addPass.value.trim();
    if(!name||!pass){ alert("名前と追加パスは必須"); return; }
    const id=Date.now();
    const card={id,name,slots,addPass:pass,notifyMsg:notifyMsg.value,maxNotifyMsg:maxNotifyMsg.value,bg:cardBG.value,stampIcon:stampIcon.value};
    cards.push(card); saveJSON(LS_KEYS.cards,cards);
    cardName.value=""; cardSlots.value=5; addPass.value=""; notifyMsg.value=""; maxNotifyMsg.value=""; cardBG.value=""; stampIcon.value="";
    refreshCardListUI();
  });

  previewClearBtn.addEventListener("click",()=>{ previewArea.innerHTML=""; });

  /* キーワード管理 */
  function renderKeywords(){
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const opt=document.createElement("option"); opt.value=c.id; opt.textContent=c.name; keywordCardSelect.appendChild(opt);
    });
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      const name=document.createElement("span"); name.textContent=cards.find(c=>c.id===k.cardId)?.name||""; li.appendChild(name);
      const word=document.createElement("span"); word.textContent=k.word; li.appendChild(word);
      const delBtn=document.createElement("button"); delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        keywords=keywords.filter(x=>!(x.cardId===k.cardId&&x.word===k.word));
        saveJSON(LS_KEYS.keywords,keywords); renderKeywords();
      });
      li.appendChild(delBtn); keywordList.appendChild(li);
    });
  }

  addKeywordBtn.addEventListener("click",()=>{
    const cardId=parseInt(keywordCardSelect.value);
    const word=keywordInput.value.trim();
    if(!word) return;
    keywords.push({cardId,word}); saveJSON(LS_KEYS.keywords,keywords);
    keywordInput.value=""; renderKeywords();
  });

  /* 更新履歴 */
  function renderUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const d=document.createElement("div"); d.textContent=u; adminUpdateLogs.appendChild(d);
    });
  }

  addUpdateBtn.addEventListener("click",()=>{
    const txt=updateInput.value.trim();
    if(!txt) return;
    updates.push(txt); saveJSON(LS_KEYS.updates,updates);
    updateInput.value=""; renderUpdates();
  });

  refreshCardListUI(); renderKeywords(); renderUpdates();
}