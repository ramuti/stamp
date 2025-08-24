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
  userUIColors: "userUIColors",
  userCardSerials: "userCardSerials"
};

const APP_VERSION = "v1.1.2";

function loadJSON(key,fallback){
  try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch(e){return fallback;}
}
function saveJSON(key,obj){localStorage.setItem(key,JSON.stringify(obj));}

let userName = localStorage.getItem(LS_KEYS.userName) || "";
let cards = loadJSON(LS_KEYS.cards, []);
let keywords = loadJSON(LS_KEYS.keywords, []);
let updates = loadJSON(LS_KEYS.updates, []);
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);
let userUIColors = loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials = loadJSON(LS_KEYS.userCardSerials, {}); // ユーザごとのカードシリアル番号

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
  }catch(e){alert("データ保存に失敗"); console.error(e);}
}

document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* =========================
   ユーザー画面
   ========================= */
function initUser(){
  const setNameBtn=document.getElementById("setNameBtn");
  const userNameInput=document.getElementById("userNameInput");
  const cardTitle=document.getElementById("cardTitle");
  const addCardBtn=document.getElementById("addCardBtn");
  const addCardPass=document.getElementById("addCardPass");
  const userCards=document.getElementById("userCards");
  const historyList=document.getElementById("stampHistory");
  const updateLogs=document.getElementById("updateLogs");

  const textColorPicker=document.getElementById("textColor");
  const bgColorPicker=document.getElementById("bgColor");
  const btnColorPicker=document.getElementById("btnColor");

  cardTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  userNameInput.value=userName;

  textColorPicker.value=userUIColors.text;
  bgColorPicker.value=userUIColors.bg;
  btnColorPicker.value=userUIColors.btn;

  applyUserColors();

  setNameBtn.addEventListener("click",()=>{
    const v=userNameInput.value.trim();
    if(!v){alert("名前を入力してください"); return;}
    userName=v;
    saveAll();
    cardTitle.textContent=`${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click",()=>{
    const pass=addCardPass.value.trim();
    if(!pass){alert("追加パスを入力してください"); return;}
    const card=cards.find(c=>c.addPass===pass);
    if(!card){alert("パスが違います"); return;}
    if(!userAddedCards.includes(card.id)){
      userAddedCards.push(card.id);

      // ユーザカードシリアル生成
      if(!userCardSerials[userName]) userCardSerials[userName]={};
      userCardSerials[userName][card.id]=Object.keys(userCardSerials[userName]).length+1;

      saveAll();
      renderUserCards();
      addCardPass.value="";
    }else alert("すでに追加済みです");
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

  textColorPicker.addEventListener("input",()=>{userUIColors.text=textColorPicker.value; saveAll(); applyUserColors();});
  bgColorPicker.addEventListener("input",()=>{userUIColors.bg=bgColorPicker.value; saveAll(); applyUserColors();});
  btnColorPicker.addEventListener("input",()=>{userUIColors.btn=btnColorPicker.value; saveAll(); applyUserColors();});

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
    serial.textContent=userCardSerials[userName]?.[card.id]||"?";
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
      if(!keywordObj){alert("合言葉が違います"); return;}
      if(!keywordObj.enabled){alert("この合言葉は無効です"); return;}
      if(userStampHistory.some(s=>s.cardId===card.id && s.word===word)){alert("既に使用済みです"); return;}

      const nextSlot=userStampHistory.filter(s=>s.cardId===card.id).length;
      if(nextSlot>=card.slots){alert(card.maxNotifyMsg||"スタンプがMAXです"); return;}

      userStampHistory.push({
        cardId:card.id,
        slot:nextSlot,
        word:word,
        date:new Date().toLocaleString()
      });
      saveAll();
      renderUserCards();
      renderHistory();
      alert(card.notifyMsg||"スタンプを押しました！");
    });
    container.appendChild(btn);

    const delBtn=document.createElement("button");
    delBtn.textContent="カードを削除";
    delBtn.style.background="#999";
    delBtn.style.marginLeft="8px";
    delBtn.addEventListener("click",()=>{
      if(!confirm("このカードを自分の端末から削除しますか？（履歴も消えます）")) return;
      userAddedCards=userAddedCards.filter(id=>id!==card.id);
      userStampHistory=userStampHistory.filter(h=>h.cardId!==card.id);
      if(userCardSerials[userName]) delete userCardSerials[userName][card.id];
      saveAll();
      renderUserCards();
      renderHistory();
    });
    container.appendChild(delBtn);

    return container;
  }

  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards=userAddedCards.filter(id=>cards.some(c=>c.id===id));
    userStampHistory=userStampHistory.filter(h=>cards.some(c=>c.id===h.cardId));
    saveAll();
    userAddedCards.forEach(id=>{
      const card=cards.find(c=>c.id===id);
      if(card) userCards.appendChild(renderUserCard(card));
    });
  }

  function renderHistory(){
    historyList.innerHTML="";
    [...userStampHistory].reverse().forEach(h=>{
      const card=cards.find(c=>c.id===h.cardId); if(!card) return;
      const li=document.createElement("li");
      li.textContent=`${card.name} — ${h.date}`;
      historyList.appendChild(li);
    });
    updateLogs.innerHTML="";
    [...updates].reverse().forEach(u=>{
      const div=document.createElement("div");
      div.textContent=`${u.date} ${u.msg}`;
      updateLogs.appendChild(div);
    });
  }

  renderUserCards();
  renderHistory();
}

/* =========================
   管理者画面
   ========================= */
function initAdmin(){
  const cardName=document.getElementById("cardName");
  const cardSlots=document.getElementById("cardSlots");
  const addPass=document.getElementById("addPass");
  const notifyMsg=document.getElementById("notifyMsg");
  const maxNotifyMsg=document.getElementById("maxNotifyMsg");
  const cardBG=document.getElementById("cardBG");
  const stampIcon=document.getElementById("stampIcon");
  const createCardBtn=document.getElementById("createCardBtn");
  const adminCardsList=document.getElementById("adminCards");
  const previewCardBtn=document.getElementById("previewCardBtn");
  const previewClearBtn=document.getElementById("previewClearBtn");

  const keywordCardSelect=document.getElementById("keywordCardSelect");
  const keywordInput=document.getElementById("keywordInput");
  const addKeywordBtn=document.getElementById("addKeywordBtn");
  const keywordList=document.getElementById("keywordList");

  const updateInput=document.getElementById("updateInput");
  const addUpdateBtn=document.getElementById("addUpdateBtn");
  const adminUpdateLogs=document.getElementById("adminUpdateLogs");
  const previewArea=document.getElementById("previewArea");

  function renderAdminCards(){
    adminCardsList.innerHTML="";
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      const info=document.createElement("div"); info.className="info";
      info.textContent=`${c.name}（枠:${c.slots} 追加パス:${c.addPass}）`;
      li.appendChild(info);

      const delBtn=document.createElement("button");
      delBtn.textContent="削除";
      delBtn.addEventListener("click",()=>{
        if(!confirm("削除しますか？")) return;
        cards=cards.filter(x=>x.id!==c.id);
        userAddedCards=userAddedCards.filter(x=>x!==c.id);
        for(const uname in userCardSerials) delete userCardSerials[uname][c.id];
        userStampHistory=userStampHistory.filter(s=>s.cardId!==c.id);
        saveAll();
        renderAdminCards();
      });
      li.appendChild(delBtn);
      adminCardsList.appendChild(li);

      const opt=document.createElement("option");
      opt.value=c.id; opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderKeywords(){
    keywordList.innerHTML="";
    keywords.forEach((k,idx)=>{
      const li=document.createElement("li");
      li.textContent=`[${cards.find(c=>c.id===k.cardId)?.name||"不明"}] ${k.word} (${k.enabled?"有効":"無効"})`;
      const toggleBtn=document.createElement("button");
      toggleBtn.textContent=k.enabled?"無効にする":"有効にする";
      toggleBtn.addEventListener("click",()=>{
        k.enabled=!k.enabled;
        saveAll();
        renderKeywords();
      });
      const delBtn=document.createElement("button");
      delBtn.textContent="削除";
      delBtn.addEventListener("click",()=>{
        if(!confirm("削除しますか？")) return;
        keywords.splice(idx,1);
        saveAll();
        renderKeywords();
      });
      li.appendChild(toggleBtn);
      li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }

  function renderUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach((u,idx)=>{
      const li=document.createElement("li");
      li.textContent=`${u.date} ${u.msg}`;
      const delBtn=document.createElement("button");
      delBtn.textContent="削除";
      delBtn.addEventListener("click",()=>{
        updates.splice(idx,1);
        saveAll();
        renderUpdates();
      });
      li.appendChild(delBtn);
      adminUpdateLogs.appendChild(li);
    });
  }

  previewCardBtn.addEventListener("click",()=>{
    previewArea.innerHTML="";
    const div=document.createElement("div");
    div.className="card"; if(cardBG.value) div.style.background=cardBG.value;
    const h3=document.createElement("h3"); h3.textContent=cardName.value; div.appendChild(h3);
    previewArea.appendChild(div);
  });
  previewClearBtn.addEventListener("click",()=>previewArea.innerHTML="");

  createCardBtn.addEventListener("click",()=>{
    const name=cardName.value.trim();
    const slots=parseInt(cardSlots.value);
    const pass=addPass.value.trim();
    if(!name||!slots||!pass){alert("全て入力してください"); return;}
    const id=Date.now().toString();
    cards.push({id,name,slots,addPass:pass,notifyMsg:notifyMsg.value,maxNotifyMsg:maxNotifyMsg.value,bg:cardBG.value});
    saveAll();
    renderAdminCards();
  });

  addKeywordBtn.addEventListener("click",()=>{
    const cardId=keywordCardSelect.value;
    const word=keywordInput.value.trim();
    if(!word||!cardId){alert("カードと合言葉を選択してください"); return;}
    keywords.push({cardId,word,enabled:true});
    saveAll();
    renderKeywords();
  });

  addUpdateBtn.addEventListener("click",()=>{
    const msg=updateInput.value.trim();
    if(!msg){alert("内容を入力してください"); return;}
    const date=new Date();
    const y=date.getFullYear(),m=date.getMonth()+1,d=date.getDate();
    updates.push({msg,date:`${y}年${m}月${d}日`});
    saveAll();
    renderUpdates();
    updateInput.value="";
  });

  renderAdminCards();
  renderKeywords();
  renderUpdates();
}