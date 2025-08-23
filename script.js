const LS_KEYS = {
  userName:"userName",
  cards:"cards",
  keywords:"keywords",
  updates:"updates",
  userAddedCards:"userAddedCards",
  userStampHistory:"userStampHistory"
};

function loadJSON(key, fallback){try{const v=localStorage.getItem(key); return v?JSON.parse(v):fallback}catch(e){return fallback}}
function saveJSON(key,obj){localStorage.setItem(key,JSON.stringify(obj))}

let userName=localStorage.getItem(LS_KEYS.userName)||"";
let cards=loadJSON(LS_KEYS.cards,[]);
let keywords=loadJSON(LS_KEYS.keywords,[]);
let updates=loadJSON(LS_KEYS.updates,[]);
let userAddedCards=loadJSON(LS_KEYS.userAddedCards,[]);
let userStampHistory=loadJSON(LS_KEYS.userStampHistory,[]);

document.addEventListener("DOMContentLoaded",()=>{
  if(document.body.classList.contains("user")) initUser();
  if(document.body.classList.contains("admin")) initAdmin();
});

function saveAll(){
  localStorage.setItem(LS_KEYS.userName,userName);
  saveJSON(LS_KEYS.cards,cards);
  saveJSON(LS_KEYS.keywords,keywords);
  saveJSON(LS_KEYS.updates,updates);
  saveJSON(LS_KEYS.userAddedCards,userAddedCards);
  saveJSON(LS_KEYS.userStampHistory,userStampHistory);
}

/* =========================
   ユーザー画面
========================= */
function initUser(){
  const cardTitle=document.getElementById("cardTitle");
  const addCardBtn=document.getElementById("addCardBtn");
  const addCardPass=document.getElementById("addCardPass");
  const userCards=document.getElementById("userCards");
  const historyList=document.getElementById("stampHistory");
  const updateLogs=document.getElementById("updateLogs");
  const setNameBtn=document.getElementById("setNameBtn");
  const userNameInput=document.getElementById("userNameInput");

  if(userName) cardTitle.textContent=`${userName}のスタンプカード`;

  setNameBtn.addEventListener("click",()=>{
    const v=userNameInput.value.trim();
    if(!v){alert("名前を入力してください"); return;}
    userName=v;
    localStorage.setItem(LS_KEYS.userName,userName);
    cardTitle.textContent=`${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click",()=>{
    const pass=addCardPass.value.trim();
    if(!pass){alert("追加パスを入力してください"); return;}
    const card=cards.find(c=>c.addPass===pass);
    if(!card){alert("パスが間違っています"); return;}
    if(!userAddedCards.includes(card.id)){
      userAddedCards.push(card.id);
      saveJSON(LS_KEYS.userAddedCards,userAddedCards);
      renderUserCards();
      addCardPass.value="";
    }else{
      alert("すでに追加済みです");
    }
  });

  function renderUserCard(card){
    const container=document.createElement("div"); container.className="card"; container.dataset.id=card.id;
    const title=document.createElement("h3"); title.textContent=card.name; container.appendChild(title);

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
    serial.textContent=String(userStampHistory.length+1).padStart(5,"0");
    container.appendChild(serial);

    const btn=document.createElement("button"); btn.textContent="スタンプを押す"; btn.style.marginTop="8px";
    btn.addEventListener("click",()=>{
      const kw=prompt("スタンプ合言葉を入力してください");
      if(kw===null) return;
      const word=kw.trim();
      if(!word){alert("合言葉を入力してください"); return;}
      const keywordObj=keywords.find(k=>String(k.cardId)===String(card.id) && k.word===word && k.active);
      if(!keywordObj){alert("合言葉が違うか無効です"); return;}
      if(userStampHistory.some(s=>s.cardId===card.id && s.keyword===word)){alert("もう押してあります"); return;}
      let nextSlot=0; while(userStampHistory.some(s=>s.cardId===card.id && s.slot===nextSlot)) nextSlot++;
      if(nextSlot>=card.slots){alert(card.maxNotifyMsg||"スタンプがMAXです"); return;}
      userStampHistory.push({cardId:card.id,slot:nextSlot,keyword:word,date:new Date().toLocaleString()});
      saveJSON(LS_KEYS.userStampHistory,userStampHistory);
      renderUserCards(); updateHistory();
      alert(card.notifyMsg||"スタンプを押しました！");
    });
    container.appendChild(btn);

    const delBtn=document.createElement("button"); delBtn.textContent="カードを削除"; delBtn.style.background="#999"; delBtn.style.marginLeft="8px";
    delBtn.addEventListener("click",()=>{
      if(!confirm("このカードを自分の端末から削除しますか？（履歴も消えます）")) return;
      userAddedCards=userAddedCards.filter(id=>id!==card.id);
      userStampHistory=userStampHistory.filter(h=>h.cardId!==card.id);
      saveAll(); renderUserCards(); updateHistory();
    });
    container.appendChild(delBtn);

    return container;
  }

  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(id=>{
      const card=cards.find(c=>c.id===id);
      if(card) userCards.appendChild(renderUserCard(card));
    });
  }

  function updateHistory(){
    historyList.innerHTML="";
    [...userStampHistory].reverse().forEach(h=>{
      const card=cards.find(c=>c.id===h.cardId); if(!card) return;
      const li=document.createElement("li");
      li.textContent=`${card.name} — ${h.date}`;
      historyList.appendChild(li);
    });
    updateLogs.innerHTML="";
    updates.slice().reverse().forEach(u=>{
      const div=document.createElement("div"); div.textContent=u; updateLogs.appendChild(div);
    });
  }

  renderUserCards(); updateHistory();
}

/* =========================
   管理者画面
========================= */
function initAdmin(){
  const cardName=document.getElementById("cardName");
  const cardSlots=document.getElementById("cardSlots");
  const notifyMsg=document.getElementById("notifyMsg");
  const maxNotifyMsg=document.getElementById("maxNotifyMsg");
  const addPass=document.getElementById("addPass");
  const cardBG=document.getElementById("cardBG");
  const stampIcon=document.getElementById("stampIcon");
  const createCardBtn=document.getElementById("createCardBtn");
  const previewArea=document.getElementById("previewArea");
  const adminCards=document.getElementById("adminCards");
  const keywordCardSelect=document.getElementById("keywordCardSelect");
  const keywordInput=document.getElementById("keywordInput");
  const addKeywordBtn=document.getElementById("addKeywordBtn");
  const keywordList=document.getElementById("keywordList");
  const updateInput=document.getElementById("updateInput");
  const addUpdateBtn=document.getElementById("addUpdateBtn");
  const adminUpdateLogs=document.getElementById("adminUpdateLogs");
  const previewClearBtn=document.getElementById("previewClearBtn");

  function refreshCardListUI(){
    adminCards.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      const left=document.createElement("div"); left.style.flex="1"; left.innerText=`${c.name} | パス:${c.addPass} | 枠:${c.slots}`;
      const del=document.createElement("button"); del.textContent="削除"; del.style.background="#999";
      del.addEventListener("click",()=>{if(!confirm("削除しますか？")) return; cards=cards.filter(cd=>cd.id!==c.id); userAddedCards=userAddedCards.filter(id=>id!==c.id); userStampHistory=userStampHistory.filter(h=>h.cardId!==c.id); keywords=keywords.filter(k=>k.cardId!==c.id); saveAll(); refreshCardListUI(); refreshKeywordSelect();});
      li.appendChild(left); li.appendChild(del); adminCards.appendChild(li);
    });
  }

  function refreshKeywordSelect(){
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{const opt=document.createElement("option"); opt.value=c.id; opt.textContent=c.name; keywordCardSelect.appendChild(opt);});
    refreshKeywordList();
  }

  function refreshKeywordList(){
    keywordList.innerHTML="";
    keywords.forEach(k=>{const li=document.createElement("li"); li.textContent=`カード:${k.cardId} | ${k.word} | active:${k.active}`; const del=document.createElement("button"); del.textContent="削除"; del.style.background="#999"; del.addEventListener("click",()=>{if(!confirm("削除しますか？")) return; keywords=keywords.filter(kw=>kw!==k); saveJSON(LS_KEYS.keywords,keywords); refreshKeywordList();}); li.appendChild(del); keywordList.appendChild(li);});
  }

  function refreshUpdates(){
    adminUpdateLogs.innerHTML=""; updates.slice().reverse().forEach(u=>{const div=document.createElement("div"); div.textContent=u; adminUpdateLogs.appendChild(div);});
  }

  createCardBtn.addEventListener("click",()=>{
    const name=cardName.value.trim();
    const slots=parseInt(cardSlots.value);
    const notify=notifyMsg.value.trim();
    const maxNotify=maxNotifyMsg.value.trim();
    const pass=addPass.value.trim();
    const bg=cardBG.value.trim();
    const stamp=stampIcon.value.trim();
    if(!name||!slots||!pass){ alert("カード名・枠数・追加パスは必須"); return; }
    const newCard={id:Date.now().toString(), name, slots, notifyMsg:notify, maxNotifyMsg:maxNotify, addPass:pass, bg, stamp};
    cards.push(newCard); saveJSON(LS_KEYS.cards,cards); refreshCardListUI(); refreshKeywordSelect(); previewArea.appendChild(renderPreviewCard(newCard));
  });

  previewClearBtn.addEventListener("click",()=>{previewArea.innerHTML="";});

  function renderPreviewCard(card){
    const div=document.createElement("div"); div.className="card"; const h=document.createElement("h3"); h.textContent=card.name; div.appendChild(h);
    const grid=document.createElement("div"); for(let i=0;i<card.slots;i++){const slot=document.createElement("div"); slot.className="stamp-slot"; grid.appendChild(slot);} div.appendChild(grid);
    return div;
  }

  addKeywordBtn.addEventListener("click",()=>{
    const cid=keywordCardSelect.value; const word=keywordInput.value.trim(); if(!cid||!word){alert("カードと合言葉を設定してください"); return;}
    keywords.push({cardId:cid, word, active:true}); saveJSON(LS_KEYS.keywords,keywords); refreshKeywordList();
  });

  addUpdateBtn.addEventListener("click",()=>{
    const text=updateInput.value.trim(); if(!text) return; updates.push(text); saveJSON(LS_KEYS.updates,updates); refreshUpdates(); updateInput.value="";
  });

  refreshCardListUI(); refreshKeywordSelect(); refreshUpdates();
}