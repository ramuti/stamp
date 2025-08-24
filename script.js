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

const APP_VERSION = "v1.2.0";

function loadJSON(key,fallback){
  try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; } catch(e){ return fallback; }
}
function saveJSON(key,obj){ localStorage.setItem(key,JSON.stringify(obj)); }

let userName=localStorage.getItem(LS_KEYS.userName)||"";
let cards=loadJSON(LS_KEYS.cards,[]);
let keywords=loadJSON(LS_KEYS.keywords,[]);
let updates=loadJSON(LS_KEYS.updates,[]);
let userAddedCards=loadJSON(LS_KEYS.userAddedCards,[]);
let userStampHistory=loadJSON(LS_KEYS.userStampHistory,[]);
let userUIColors=loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
let userCardSerials=loadJSON(LS_KEYS.userCardSerials,{});

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

/* ================= USER ================= */
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

  cardTitle.textContent=userName?`${userName}のスタンプカード`:"スタンプカード";
  userNameInput.value=userName;
  textColorPicker.value=userUIColors.text;
  bgColorPicker.value=userUIColors.bg;
  btnColorPicker.value=userUIColors.btn;
  applyUserColors();

  setNameBtn.addEventListener("click",()=>{
    const v=userNameInput.value.trim();
    if(!v){alert("名前を入力してください"); return;}
    userName=v; saveAll(); cardTitle.textContent=`${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click",()=>{
    const pass=addCardPass.value.trim();
    if(!pass){alert("追加パスを入力してください"); return;}
    const card=cards.find(c=>c.addPass===pass);
    if(!card){alert("パスが違います"); return;}
    if(!userAddedCards.includes(card.id)){
      userAddedCards.push(card.id);
      if(!userCardSerials[userName]) userCardSerials[userName]=0;
      userCardSerials[userName]++; saveAll();
      renderCards();
    } else { alert("すでに追加済みです"); }
    addCardPass.value="";
  });

  textColorPicker.addEventListener("input",()=>{userUIColors.text=textColorPicker.value; applyUserColors(); saveAll();});
  bgColorPicker.addEventListener("input",()=>{userUIColors.bg=bgColorPicker.value; applyUserColors(); saveAll();});
  btnColorPicker.addEventListener("input",()=>{userUIColors.btn=btnColorPicker.value; applyUserColors(); saveAll();});

  renderCards();
  renderHistory();
  renderUpdates();

  function applyUserColors(){
    document.body.style.color=userUIColors.text;
    document.body.style.background=userUIColors.bg;
    const btns=document.querySelectorAll("button");
    btns.forEach(b=>b.style.background=userUIColors.btn);
  }

  function renderCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(cid=>{
      const card=cards.find(c=>c.id===cid);
      if(!card) return; 
      const div=document.createElement("div");
      div.className="card";
      const name=document.createElement("div"); name.textContent=card.name;
      div.appendChild(name);

      for(let i=0;i<card.slots;i++){
        const span=document.createElement("div");
        span.className="stamp-slot";
        if(userStampHistory.find(s=>s.cardId===cid && s.slot===i)) span.classList.add("stamp-filled");
        span.addEventListener("click",()=>{
          const keywordEntry=keywords.find(k=>k.cardId===cid);
          if(!keywordEntry){alert("このカードには合言葉が設定されていません"); return;}
          const inp=prompt("合言葉を入力してください");
          if(!inp) return;
          if(inp!==keywordEntry.word){alert("合言葉が違います"); return;}
          if(!keywordEntry.enabled){alert("この合言葉は無効です"); return;}
          if(userStampHistory.find(s=>s.cardId===cid && s.slot===i)){alert("すでに押しました"); return;}
          userStampHistory.push({cardId:cid, slot:i, date:new Date().toLocaleString()});
          saveAll();
          span.classList.add("stamp-filled");
          alert("スタンプを押しました！");
          renderHistory();
        });
        div.appendChild(span);
      }

      const serialDiv=document.createElement("div");
      serialDiv.className="serial";
      const serial=userCardSerials[userName]?userCardSerials[userName]:1;
      serialDiv.textContent=`カード番号: ${serial}`;
      div.appendChild(serialDiv);

      userCards.appendChild(div);
    });
  }

  function renderHistory(){
    historyList.innerHTML="";
    userStampHistory.forEach(s=>{
      const card=cards.find(c=>c.id===s.cardId);
      if(!card) return; //カード削除されてたら履歴も消す
      const li=document.createElement("li");
      li.textContent=`[${s.date}] ${card.name} スタンプ${s.slot+1}`;
      historyList.appendChild(li);
    });
    // 古い履歴を削除
    userStampHistory=userStampHistory.filter(s=>cards.find(c=>c.id===s.cardId));
    saveAll();
  }

  function renderUpdates(){
    updateLogs.innerHTML="";
    updates.forEach(u=>{
      const div=document.createElement("div");
      div.textContent=`[${u.date}] ${u.text}`;
      updateLogs.appendChild(div);
    });
  }
}

/* ================= ADMIN ================= */
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

  function renderAdminCards(){
    adminCards.innerHTML="";
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const li=document.createElement("li");
      li.className="adminCard";
      const info=document.createElement("span");
      info.className="info";
      info.textContent=`${c.name} 枠:${c.slots} パス:${c.addPass}`;
      li.appendChild(info);

      const delBtn=document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        if(confirm("削除しますか？")){
          cards=cards.filter(x=>x.id!==c.id);
          //ユーザ側のカードも削除
          userAddedCards=userAddedCards.filter(x=>x!==c.id);
          userStampHistory=userStampHistory.filter(s=>s.cardId!==c.id);
          saveAll();
          renderAdminCards();
        }
      });
      li.appendChild(delBtn);

      adminCards.appendChild(li);

      const opt=document.createElement("option");
      opt.value=c.id; opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  createCardBtn.addEventListener("click",()=>{
    if(!cardName.value.trim()){alert("カード名を入力"); return;}
    const cid="c"+Date.now();
    const newCard={
      id:cid,
      name:cardName.value.trim(),
      slots:parseInt(cardSlots.value)||5,
      addPass:addPass.value.trim(),
      notifyMsg:notifyMsg.value.trim(),
      maxNotifyMsg:maxNotifyMsg.value.trim(),
      bg:cardBG.value,
      stampIcon:stampIcon.value
    };
    cards.push(newCard);
    saveAll();
    renderAdminCards();
  });

  previewCardBtn.addEventListener("click",()=>{
    const div=document.createElement("div");
    div.className="card";
    div.style.background=cardBG.value;
    div.textContent=`${cardName.value} 枠:${cardSlots.value}`;
    previewArea.appendChild(div);
  });
  previewClearBtn.addEventListener("click",()=>{previewArea.innerHTML="";});

  addKeywordBtn.addEventListener("click",()=>{
    const cid=keywordCardSelect.value;
    if(!cid){alert("カード選択"); return;}
    const kw=keywordInput.value.trim();
    if(!kw){alert("合言葉入力"); return;}
    keywords.push({cardId:cid,word:kw,enabled:true});
    saveAll();
    renderKeywords();
  });

  function renderKeywords(){
    keywordList.innerHTML="";
    keywords.forEach((k,i)=>{
      const li=document.createElement("li");
      li.textContent=`${cards.find(c=>c.id===k.cardId)?.name||"削除済"} : ${k.word} [${k.enabled?"有効":"無効"}]`;
      const toggleBtn=document.createElement("button");
      toggleBtn.textContent="切替";
      toggleBtn.addEventListener("click",()=>{k.enabled=!k.enabled; saveAll(); renderKeywords();});
      const delBtn=document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{keywords.splice(i,1); saveAll(); renderKeywords();});
      li.appendChild(toggleBtn);
      li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }

  addUpdateBtn.addEventListener("click",()=>{
    const text=updateInput.value.trim();
    if(!text){alert("更新内容入力"); return;}
    const date=new Date(); 
    updates.push({text,date:`${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`});
    saveAll();
    renderUpdates();
  });

  function renderUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach((u,i)=>{
      const li=document.createElement("li");
      li.textContent=`[${u.date}] ${u.text}`;
      const delBtn=document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{updates.splice(i,1); saveAll(); renderUpdates();});
      li.appendChild(delBtn);
      adminUpdateLogs.appendChild(li);
    });
  }

  renderAdminCards();
  renderKeywords();
  renderUpdates();
}