/* ============================
   script.js — ユーザー＋管理者 共通
   ============================ */

const LS_KEYS = {
  appVersion:"appVersion",
  userName:"userName",
  cards:"cards",
  keywords:"keywords",
  updates:"updates",
  userAddedCards:"userAddedCards",
  userStampHistory:"userStampHistory"
};

const APP_VERSION = "v1.0.0";

function loadJSON(key,fallback){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; }catch(e){return fallback;} }
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
  }catch(e){ alert("データ保存に失敗しました。"); console.error(e); }
}

document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* ============================ ユーザー側 ============================ */
function initUser(){
  const setNameBtn=document.getElementById("setNameBtn");
  const userNameInput=document.getElementById("userNameInput");
  const cardTitle=document.getElementById("cardTitle");
  const addCardBtn=document.getElementById("addCardBtn");
  const addCardPass=document.getElementById("addCardPass");
  const userCards=document.getElementById("userCards");
  const historyList=document.getElementById("stampHistory");
  const updateLogs=document.getElementById("updateLogs");

  cardTitle.textContent = userName?`${userName}のスタンプカード`:"スタンプカード";
  userNameInput.value=userName;

  setNameBtn.addEventListener("click",()=>{
    const v=userNameInput.value.trim();
    if(v){ userName=v; cardTitle.textContent=`${userName}のスタンプカード`; saveAll(); }
  });

  addCardBtn.addEventListener("click",()=>{
    const pass=addCardPass.value.trim();
    if(!pass){ alert("追加パスを入力してください"); return; }
    const found = cards.find(c=>c.addPass===pass);
    if(!found){ alert("カードが存在しません"); return; }
    if(userAddedCards.includes(pass)){ alert("すでに追加済み"); return; }
    userAddedCards.push(pass); saveAll(); renderUserCards(); addCardPass.value="";
  });

  // カラー設定
  const bgPicker=document.getElementById("bgColorPicker");
  const textPicker=document.getElementById("textColorPicker");
  const buttonPicker=document.getElementById("buttonColorPicker");

  function applyColors(){
    document.body.style.backgroundColor=bgPicker.value;
    document.body.style.color=textPicker.value;
    document.querySelectorAll("button").forEach(btn=>btn.style.backgroundColor=buttonPicker.value);
  }

  bgPicker.addEventListener("input",applyColors);
  textPicker.addEventListener("input",applyColors);
  buttonPicker.addEventListener("input",applyColors);
  applyColors();

  function renderUserCards(){
    userCards.innerHTML="";
    if(userAddedCards.length===0){ historyList.innerHTML=""; return; }

    userAddedCards.forEach(pass=>{
      const c=cards.find(c=>c.addPass===pass);
      if(!c) return;
      const cardDiv=document.createElement("div");
      cardDiv.classList.add("card");
      cardDiv.style.background=c.bgColor||"#fff0f5";
      cardDiv.innerHTML=`<strong>${c.name}</strong><br>`;
      for(let i=0;i<c.slots;i++){
        const slot=document.createElement("span");
        slot.classList.add("stamp-slot");
        slot.dataset.card=pass;
        slot.dataset.index=i;
        if(userStampHistory.find(h=>h.cardPass===pass && h.index===i)) slot.classList.add("stamp-filled");
        slot.addEventListener("click",()=>{ slot.classList.toggle("stamp-filled"); updateStampHistory(pass,i,slot.classList.contains("stamp-filled")); });
        cardDiv.appendChild(slot);
      }
      userCards.appendChild(cardDiv);
    });

    // 履歴表示
    historyList.innerHTML="";
    userStampHistory.forEach(h=>{
      const cardName=cards.find(c=>c.addPass===h.cardPass)?.name||"";
      historyList.innerHTML+=`<li>${cardName} - スロット ${h.index+1} - ${h.filled?"押印":"未押印"}</li>`;
    });

    // 更新履歴表示
    updateLogs.innerHTML="";
    updates.forEach(u=>{
      const d=document.createElement("div");
      d.textContent=u;
      updateLogs.appendChild(d);
    });
  }

  function updateStampHistory(pass,index,filled){
    const idx=userStampHistory.findIndex(h=>h.cardPass===pass && h.index===index);
    if(filled){
      if(idx<0) userStampHistory.push({cardPass:pass,index: index, filled:true});
      else userStampHistory[idx].filled=true;
    } else {
      if(idx>=0) userStampHistory.splice(idx,1);
    }
    saveAll(); renderUserCards();
  }

  renderUserCards();
}

/* ============================ 管理者側 ============================ */
function initAdmin(){
  const cardName=document.getElementById("cardName");
  const cardSlots=document.getElementById("cardSlots");
  const addPass=document.getElementById("addPass");
  const notifyMsg=document.getElementById("notifyMsg");
  const maxNotifyMsg=document.getElementById("maxNotifyMsg");
  const cardBG=document.getElementById("cardBG");
  const stampIcon=document.getElementById("stampIcon");
  const previewCardBtn=document.getElementById("previewCardBtn");
  const previewClearBtn=document.getElementById("previewClearBtn");
  const createCardBtn=document.getElementById("createCardBtn");
  const adminCards=document.getElementById("adminCards");
  const keywordCardSelect=document.getElementById("keywordCardSelect");
  const keywordInput=document.getElementById("keywordInput");
  const addKeywordBtn=document.getElementById("addKeywordBtn");
  const keywordList=document.getElementById("keywordList");
  const updateInput=document.getElementById("updateInput");
  const addUpdateBtn=document.getElementById("addUpdateBtn");
  const adminUpdateLogs=document.getElementById("adminUpdateLogs");
  const previewArea=document.getElementById("previewArea");

  function renderCards(){
    adminCards.innerHTML="";
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      li.innerHTML=`<span>${c.name}</span> <span>${c.addPass}</span> <button class="previewBtn">プレビュー</button> <button class="delBtn">消去</button>`;
      li.querySelector(".delBtn").addEventListener("click",()=>{
        cards=cards.filter(x=>x.addPass!==c.addPass); saveAll(); renderCards();
      });
      li.querySelector(".previewBtn").addEventListener("click",()=>{
        previewArea.innerHTML="";
        const cardDiv=document.createElement("div");
        cardDiv.classList.add("card");
        cardDiv.style.background=c.bgColor||"#fff0f5";
        cardDiv.innerHTML=`<strong>${c.name}</strong><br>`;
        for(let i=0;i<c.slots;i++){
          const slot=document.createElement("span");
          slot.classList.add("stamp-slot");
          cardDiv.appendChild(slot);
        }
        previewArea.appendChild(cardDiv);
      });
      adminCards.appendChild(li);

      const opt=document.createElement("option");
      opt.value=c.addPass; opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  createCardBtn.addEventListener("click",()=>{
    const name=cardName.value.trim();
    const slots=parseInt(cardSlots.value)||1;
    const pass=addPass.value.trim();
    if(!name||!pass){ alert("カード名と追加パス必須"); return; }
    cards.push({name:name,slots:slots,addPass:pass,notify:notifyMsg.value,maxNotify:maxNotifyMsg.value,bgColor:cardBG.value,stampIcon:stampIcon.value});
    saveAll(); renderCards(); alert("作成完了"); cardName.value=""; addPass.value=""; cardSlots.value="5"; notifyMsg.value=""; maxNotifyMsg.value=""; stampIcon.value="";
  });

  previewCardBtn.addEventListener("click",()=>{
    const name=cardName.value.trim();
    const slots=parseInt(cardSlots.value)||1;
    previewArea.innerHTML="";
    const cardDiv=document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.style.background=cardBG.value||"#fff0f5";
    cardDiv.innerHTML=`<strong>${name}</strong><br>`;
    for(let i=0;i<slots;i++){
      const slot=document.createElement("span");
      slot.classList.add("stamp-slot");
      cardDiv.appendChild(slot);
    }
    previewArea.appendChild(cardDiv);
  });

  previewClearBtn.addEventListener("click",()=>{ previewArea.innerHTML=""; });

  // キーワード追加
  addKeywordBtn.addEventListener("click",()=>{
    const cPass=keywordCardSelect.value;
    const kw=keywordInput.value.trim();
    if(!cPass||!kw){ alert("カードと合言葉を選択してください"); return; }
    keywords.push({card:cPass,keyword:kw});
    saveAll(); renderKeywords(); keywordInput.value="";
  });

  function renderKeywords(){
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      li.textContent=`${cards.find(c=>c.addPass===k.card)?.name||""} - ${k.keyword} `;
      const del=document.createElement("button"); del.textContent="消去";
      del.addEventListener("click",()=>{
        keywords=keywords.filter(x=>x!==k); saveAll(); renderKeywords();
      });
      li.appendChild(del);
      keywordList.appendChild(li);
    });
  }

  addUpdateBtn.addEventListener("click",()=>{
    const txt=updateInput.value.trim();
    if(!txt) return;
    updates.push(txt); saveAll(); renderUpdates(); updateInput.value="";
  });

  function renderUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const d=document.createElement("div");
      d.textContent=u;
      adminUpdateLogs.appendChild(d);
    });
  }

  renderCards(); renderKeywords(); renderUpdates();
}