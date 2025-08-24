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
let userCardSerials = loadJSON(LS_KEYS.userCardSerials, {});

function saveAll() {
  try {
    localStorage.setItem(LS_KEYS.userName, userName);
    saveJSON(LS_KEYS.cards, cards);
    saveJSON(LS_KEYS.keywords, keywords);
    saveJSON(LS_KEYS.updates, updates);
    saveJSON(LS_KEYS.userAddedCards, userAddedCards);
    saveJSON(LS_KEYS.userStampHistory, userStampHistory);
    saveJSON(LS_KEYS.userUIColors, userUIColors);
    saveJSON(LS_KEYS.userCardSerials, userCardSerials);
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

  setNameBtn.addEventListener("click", () => {
    const v = userNameInput.value.trim();
    if (!v) { alert("名前を入力してください"); return; }
    userName = v;
    saveAll();
    cardTitle.textContent = `${userName}のスタンプカード`;
  });

  addCardBtn.addEventListener("click", () => {
    const pass = addCardPass.value.trim();
    if (!pass) { alert("追加パスを入力してください"); return; }
    const card = cards.find(c => c.addPass === pass);
    if (!card) { alert("パスが一致するカードがありません"); return; }
    if (userAddedCards.find(c=>c.addPass===pass)) { alert("すでに追加済みです"); return; }

    // ユーザごとにシリアル付与
    if (!userCardSerials[pass]) userCardSerials[pass] = Object.keys(userCardSerials).length+1;

    userAddedCards.push({addPass:pass});
    saveAll();
    renderUserCards();
  });

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach(({addPass}) => {
      const card = cards.find(c=>c.addPass===addPass);
      if(!card) return; // 消去されたカードは表示しない

      const div = document.createElement("div");
      div.classList.add("card");

      const title = document.createElement("div");
      title.textContent = card.name;
      title.style.fontWeight="bold";
      div.appendChild(title);

      const slotsDiv = document.createElement("div");
      for(let i=0;i<card.slots;i++){
        const span = document.createElement("span");
        span.classList.add("stamp-slot");
        const stamped = userStampHistory.find(h=>h.cardAddPass===addPass && h.slot===i);
        if(stamped) span.classList.add("stamp-filled");
        span.addEventListener("click",()=>{
          const kw = prompt("合言葉を入力してください");
          if(!kw) return;
          const k = keywords.find(kwd=>kwd.cardAddPass===addPass && kwd.word===kw);
          if(!k) { alert("合言葉が違うか、無効です"); return; }
          const already = userStampHistory.find(h=>h.cardAddPass===addPass && h.slot===i);
          if(already) { alert("このスタンプはすでに押されています"); return; }
          span.classList.add("stamp-filled");
          const now = new Date();
          userStampHistory.push({cardAddPass:addPass,slot:i,time:now.toLocaleString()});
          saveAll();
          alert("スタンプを押しました！");
          renderStampHistory();
        });
        slotsDiv.appendChild(span);
      }
      div.appendChild(slotsDiv);

      const serial = document.createElement("div");
      serial.classList.add("serial");
      serial.textContent = `カード番号: ${userCardSerials[addPass]}`;
      div.appendChild(serial);

      userCards.appendChild(div);
    });
  }

  function renderStampHistory(){
    historyList.innerHTML="";
    userStampHistory.forEach(h=>{
      const card = cards.find(c=>c.addPass===h.cardAddPass);
      if(!card) return; // 削除されたカードは履歴からも消す
      const li=document.createElement("li");
      li.textContent = `${card.name}：${h.time}`;
      historyList.appendChild(li);
    });
  }

  function renderUpdates(){
    updateLogs.innerHTML="";
    updates.forEach(u=>{
      const d = new Date(u.time);
      const div = document.createElement("div");
      div.textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日：${u.text}`;
      updateLogs.appendChild(div);
    });
  }

  function applyUserColors(){
    document.body.style.color = userUIColors.text;
    document.body.style.backgroundColor = userUIColors.bg;
    document.querySelectorAll("button").forEach(b=>b.style.backgroundColor=userUIColors.btn);
  }

  textColorPicker.addEventListener("input",(e)=>{
    userUIColors.text=e.target.value;
    applyUserColors();
    saveAll();
  });
  bgColorPicker.addEventListener("input",(e)=>{
    userUIColors.bg=e.target.value;
    applyUserColors();
    saveAll();
  });
  btnColorPicker.addEventListener("input",(e)=>{
    userUIColors.btn=e.target.value;
    applyUserColors();
    saveAll();
  });

  renderUserCards();
  renderStampHistory();
  renderUpdates();
}

/* =========================
   管理者画面
   ========================= */
function initAdmin(){
  const cardName = document.getElementById("cardName");
  const cardSlots= document.getElementById("cardSlots");
  const addPass   = document.getElementById("addPass");
  const notifyMsg = document.getElementById("notifyMsg");
  const maxNotifyMsg = document.getElementById("maxNotifyMsg");
  const cardBG    = document.getElementById("cardBG");
  const stampIcon = document.getElementById("stampIcon");

  const previewCardBtn = document.getElementById("previewCardBtn");
  const previewClearBtn= document.getElementById("previewClearBtn");
  const createCardBtn = document.getElementById("createCardBtn");
  const adminCards = document.getElementById("adminCards");

  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  const previewArea = document.getElementById("previewArea");

  function renderCardSelect(){
    keywordCardSelect.innerHTML="";
    cards.forEach(c=>{
      const opt = document.createElement("option");
      opt.value=c.addPass;
      opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  function renderAdminCards(){
    adminCards.innerHTML="";
    cards.forEach(c=>{
      const li = document.createElement("li");
      const info = document.createElement("div");
      info.classList.add("info");
      info.textContent=`${c.name} / 枠:${c.slots} / 追加パス:${c.addPass}`;

      const btns = document.createElement("div");
      btns.classList.add("btns");
      const delBtn = document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{
        if(confirm("本当に削除しますか？")){
          cards = cards.filter(x=>x.addPass!==c.addPass);
          // キーワードも削除
          keywords = keywords.filter(k=>k.cardAddPass!==c.addPass);
          saveAll();
          renderAdminCards();
          renderCardSelect();
        }
      });
      btns.appendChild(delBtn);

      li.appendChild(info);
      li.appendChild(btns);
      adminCards.appendChild(li);
    });
  }

  function renderKeywordList(){
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li = document.createElement("li");
      li.textContent = `${k.word} [${k.cardAddPass}] ${k.enabled ? "" : "(無効)"} `;
      const del = document.createElement("button");
      del.textContent="削除";
      del.addEventListener("click",()=>{ 
        keywords = keywords.filter(x=>x!==k); saveAll(); renderKeywordList();
      });
      li.appendChild(del);

      const toggle = document.createElement("button");
      toggle.textContent = k.enabled?"無効に":"有効に";
      toggle.addEventListener("click",()=>{
        k.enabled=!k.enabled; saveAll(); renderKeywordList();
      });
      li.appendChild(toggle);

      keywordList.appendChild(li);
    });
  }

  function renderUpdateLogs(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const d = new Date(u.time);
      const div = document.createElement("div");
      div.textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日：${u.text}`;
      adminUpdateLogs.appendChild(div);
    });
  }

  previewCardBtn.addEventListener("click",()=>{
    previewArea.innerHTML="";
    const div = document.createElement("div");
    div.classList.add("card");
    div.style.backgroundColor=cardBG.value;
    div.textContent=`${cardName.value} / 枠:${cardSlots.value}`;
    previewArea.appendChild(div);
  });
  previewClearBtn.addEventListener("click",()=>{ previewArea.innerHTML=""; });

  createCardBtn.addEventListener("click",()=>{
    if(!cardName.value || !addPass.value){ alert("カード名と追加パスは必須"); return; }
    if(cards.find(c=>c.addPass===addPass.value)){ alert("追加パスが重複しています"); return; }
    cards.push({name:cardName.value,slots:Number(cardSlots.value),addPass:addPass.value,notifyMsg:notifyMsg.value,maxNotifyMsg:maxNotifyMsg.value,bg:cardBG.value,stampIcon:stampIcon.value});
    saveAll();
    renderAdminCards();
    renderCardSelect();
    alert("カードを作成しました");
  });

  addKeywordBtn.addEventListener("click",()=>{
    if(!keywordInput.value || !keywordCardSelect.value){ alert("合言葉とカードを選択してください"); return; }
    keywords.push({cardAddPass:keywordCardSelect.value,word:keywordInput.value,enabled:true});
    saveAll();
    renderKeywordList();
    keywordInput.value="";
  });

  addUpdateBtn.addEventListener("click",()=>{
    if(!updateInput.value){ alert("更新内容を入力してください"); return; }
    updates.push({text:updateInput.value,time:new Date()});
    saveAll();
    renderUpdateLogs();
    updateInput.value="";
  });

  renderAdminCards();
  renderCardSelect();
  renderKeywordList();
  renderUpdateLogs();
}