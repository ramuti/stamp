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
  try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch(e){return fallback;}
}
function saveJSON(key,obj){localStorage.setItem(key,JSON.stringify(obj));}

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
  }catch(e){alert("データ保存に失敗");console.error(e);}
}

document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

/* ==================== ユーザー画面 ==================== */
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
    if(!v){alert("名前を入力してください");return;}
    userName=v;
    if(!userCardSerials[userName]) userCardSerials[userName]={};
    saveAll();
    cardTitle.textContent=`${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click",()=>{
    const pass=addCardPass.value.trim();
    if(!pass){alert("追加パスを入力してください");return;}
    const card=cards.find(c=>c.addPass===pass);
    if(!card){alert("パスが違います");return;}
    if(!userAddedCards.includes(card.id)){
      userAddedCards.push(card.id);
      if(!userCardSerials[userName]) userCardSerials[userName]={};
      if(!userCardSerials[userName][card.id]) userCardSerials[userName][card.id]=Object.keys(userCardSerials).length+1;
      saveAll();
      renderUserCards();
      addCardPass.value="";
    } else alert("すでに追加済みです");
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

  function renderUserCards(){
    userCards.innerHTML="";
    userAddedCards.forEach(cardId=>{
      const card=cards.find(c=>c.id===cardId);
      if(!card) return;
      const div=document.createElement("div");
      div.className="card";

      const title=document.createElement("h3");
      title.textContent=card.name;
      div.appendChild(title);

      const slotContainer=document.createElement("div");
      for(let i=0;i<card.slots;i++){
        const slot=document.createElement("div");
        slot.className="stamp-slot";
        const filled=userStampHistory.some(s=>s.cardId===card.id && s.slot===i);
        if(filled) slot.classList.add("stamp-filled");
        slotContainer.appendChild(slot);
      }
      div.appendChild(slotContainer);

      const btn=document.createElement("button");
      btn.textContent="スタンプを押す";
      btn.addEventListener("click",()=>{
        const kw=prompt("スタンプ合言葉を入力してください");
        if(kw===null) return;
        const word=kw.trim();
        if(!word){alert("合言葉を入力してください"); return;}
        const keywordObj=keywords.find(k=>String(k.cardId)===String(card.id) && k.word===word);
        if(!keywordObj){alert("合言葉が違います"); return;}
        if(!keywordObj.enabled){alert("この合言葉は無効です"); return;}
        const usedSlots=userStampHistory.filter(s=>s.cardId===card.id && s.word===word);
        if(usedSlots.length>0){alert("この合言葉は既に使用済みです"); return;}
        const nextSlot=userStampHistory.filter(s=>s.cardId===card.id).length;
        if(nextSlot>=card.slots){alert("すでにMAXです"); return;}
        const dt=new Date();
        userStampHistory.push({cardId:card.id,slot:nextSlot,word:word,time:dt.toISOString()});
        saveAll();
        renderUserCards();
        renderHistory();
        alert("スタンプを押しました！"); // アラート
      });
      div.appendChild(btn);

      const serial=document.createElement("div");
      serial.className="serial";
      serial.textContent=`カード番号: ${userCardSerials[userName]?.[card.id]||"-"}`;
      div.appendChild(serial);

      userCards.appendChild(div);
    });
  }

  function renderHistory(){
    historyList.innerHTML="";
    userStampHistory.forEach(st=>{
      const card=cards.find(c=>c.id===st.cardId);
      if(!card) return;
      const li=document.createElement("li");
      const dt=new Date(st.time);
      li.textContent=`[${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日 ${dt.getHours()}:${dt.getMinutes().toString().padStart(2,"0")}] ${card.name} - ${st.word}`;
      historyList.appendChild(li);
    });
  }

  function renderUpdateLogs(){
    updateLogs.innerHTML="";
    updates.forEach(u=>{
      const dt=new Date(u.time);
      const div=document.createElement("div");
      div.textContent=`[${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日] ${u.text}`;
      updateLogs.appendChild(div);
    });
  }

  renderUserCards();
  renderHistory();
  renderUpdateLogs();
}

/* ==================== 管理者画面 ==================== */
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
    cards.forEach(c=>{
      const li=document.createElement("li");
      const info=document.createElement("div");
      info.className="info";
      info.textContent=`${c.name} [ID:${c.id}] カード番号:${Object.values(userCardSerials).map(u=>u[c.id]).find(v=>v)||"-"} 枠数:${c.slots} 通知:${c.notifyMsg||""} MAX通知:${c.maxNotifyMsg||""}`;
      li.appendChild(info);

      const btns=document.createElement("div");
      btns.className="btns";
      const delBtn=document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        if(confirm("本当に消しますか？")){
          cards=cards.filter(cd=>cd.id!==c.id);
          keywords=keywords.filter(k=>k.cardId!==c.id);
          userAddedCards=userAddedCards.filter(id=>id!==c.id);
          for(const uname in userCardSerials){ delete userCardSerials[uname][c.id]; }
          userStampHistory=userStampHistory.filter(st=>st.cardId!==c.id);
          saveAll();
          renderAdminCards();
        }
      });
      btns.appendChild(delBtn);
      li.appendChild(btns);
      adminCards.appendChild(li);
    });

    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const opt=document.createElement("option");
      opt.value=c.id;
      opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderKeywords(){
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      li.textContent=`[${cards.find(c=>c.id===k.cardId)?.name||""}] ${k.word} - ${k.enabled?"有効":"無効"}`;
      const toggle=document.createElement("button");
      toggle.textContent=k.enabled?"無効にする":"有効にする";
      toggle.addEventListener("click",()=>{
        k.enabled=!k.enabled;
        saveAll();
        renderKeywords();
      });
      li.appendChild(toggle);
      keywordList.appendChild(li);
    });
  }

  addKeywordBtn.addEventListener("click",()=>{
    const word=keywordInput.value.trim();
    const cid=keywordCardSelect.value;
    if(!word){alert("合言葉を入力してください"); return;}
    keywords.push({cardId:cid,word,enabled:true});
    saveAll();
    renderKeywords();
    keywordInput.value="";
  });

  previewCardBtn.addEventListener("click",()=>{
    previewArea.innerHTML="";
    const div=document.createElement("div");
    div.className="card";
    div.textContent=`${cardName.value||"カード名"} 枠数:${cardSlots.value||5}`;
    previewArea.appendChild(div);
  });
  previewClearBtn.addEventListener("click",()=>{previewArea.innerHTML="";});

  createCardBtn.addEventListener("click",()=>{
    const id=Date.now().toString();
    cards.push({
      id,name:cardName.value.trim()||"カード",
      slots:parseInt(cardSlots.value)||5,
      addPass:addPass.value.trim(),
      notifyMsg:notifyMsg.value.trim(),
      maxNotifyMsg:maxNotifyMsg.value.trim(),
      bg:cardBG.value,stampIcon:stampIcon.value
    });
    saveAll();
    renderAdminCards();
  });

  addUpdateBtn.addEventListener("click",()=>{
    const text=updateInput.value.trim();
    if(!text){alert("更新内容を入力してください"); return;}
    updates.push({text,time:new Date().toISOString()});
    saveAll();
    renderUpdateLogs();
    updateInput.value="";
  });

  function renderUpdateLogs(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const dt=new Date(u.time);
      const div=document.createElement("div");
      div.textContent=`[${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日] ${u.text}`;
      adminUpdateLogs.appendChild(div);
    });
  }

  renderAdminCards();
  renderKeywords();
  renderUpdateLogs();
}