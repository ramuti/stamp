/* ============================
   script.js — ユーザー＋管理者 共通（修正版）
   ・管理者でカード作成やキーワード追加が即反映
   ・コピー用ボタンで JSON コピー
   ・ユーザーは update.js を基準に読み込み
============================ */

// --------------------
// LocalStorageキー定義
// --------------------
const LS_KEYS = {
  appVersion: "appVersion",
  userName: "userName",
  cards: "cards",
  keywords: "keywords",
  updates: "updates",
  userAddedCards: "userAddedCards",
  userStampHistory: "userStampHistory",
  userUIColors: "userUIColors",
  userCardSerials: "userCardSerials"  // ユーザー別カードシリアル
};

// アプリバージョン
const APP_VERSION = "v1.6.2";

// --------------------
// JSON読み書き補助
// --------------------
function loadJSON(key,fallback){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; }catch(e){ return fallback; } }
function saveJSON(key,obj){ localStorage.setItem(key,JSON.stringify(obj)); }

// 配列マージ（ユニーク）
function mergeUniqueArray(existingArray,newArray){
  const set = new Set(existingArray||[]);
  (newArray||[]).forEach(v=>set.add(v));
  return Array.from(set);
}

// スタンプ履歴マージ（重複排除）
function mergeStampHistories(existing,current){
  const map=new Map();
  (existing||[]).forEach(e=>{
    const key=`${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`;
    map.set(key,e);
  });
  (current||[]).forEach(e=>{
    const key=`${e.cardId}||${e.slot}||${e.word||""}||${e.datetime||""}`;
    if(!map.has(key)) map.set(key,e);
  });
  return Array.from(map.values());
}

// ユーザー別カードシリアルマージ
function mergeUserCardSerials(existing,current){
  const merged = JSON.parse(JSON.stringify(existing||{}));
  for(const user in (current||{})){
    if(!merged[user]) merged[user]={};
    for(const cid in current[user]){
      if(merged[user][cid]===undefined || merged[user][cid]===null) merged[user][cid]=current[user][cid];
    }
  }
  return merged;
}

// --------------------
// 全データ保存
// --------------------
function saveAll(){
  try{
    localStorage.setItem(LS_KEYS.appVersion,APP_VERSION);
    localStorage.setItem(LS_KEYS.userName,userName);
    saveJSON(LS_KEYS.cards,cards);
    saveJSON(LS_KEYS.keywords,keywords);
    saveJSON(LS_KEYS.updates,updates);

    const existingUserAdded=loadJSON(LS_KEYS.userAddedCards,[]);
    userAddedCards=mergeUniqueArray(existingUserAdded,userAddedCards);
    saveJSON(LS_KEYS.userAddedCards,userAddedCards);

    const existingHistory=loadJSON(LS_KEYS.userStampHistory,[]);
    userStampHistory=mergeStampHistories(existingHistory,userStampHistory);
    saveJSON(LS_KEYS.userStampHistory,userStampHistory);

    const existingSerials=loadJSON(LS_KEYS.userCardSerials,{});
    userCardSerials=mergeUserCardSerials(existingSerials,userCardSerials);
    saveJSON(LS_KEYS.userCardSerials,userCardSerials);

    const existingColors=loadJSON(LS_KEYS.userUIColors,{text:"#c44a7b",bg:"#fff0f5",btn:"#ff99cc"});
    userUIColors=Object.assign({},existingColors,userUIColors||{});
    saveJSON(LS_KEYS.userUIColors,userUIColors);
  }catch(e){ alert("データ保存に失敗"); console.error(e); }
}
// --------------------
// 初期データロード
// --------------------
let userName = localStorage.getItem(LS_KEYS.userName) || "";

// update.js があれば優先して読み込む
let cards = (typeof update !== "undefined" && update.cards) ? update.cards : loadJSON(LS_KEYS.cards, []);
let keywords = (typeof update !== "undefined" && update.keywords) ? update.keywords : loadJSON(LS_KEYS.keywords, []);
let updates = (typeof update !== "undefined" && update.updates) ? update.updates : loadJSON(LS_KEYS.updates, []);

// ユーザー固有データは常に localStorage 優先
let userAddedCards = loadJSON(LS_KEYS.userAddedCards, []);
let userStampHistory = loadJSON(LS_KEYS.userStampHistory, []);
let userUIColors = loadJSON(LS_KEYS.userUIColors, { text:"#c44a7b", bg:"#fff0f5", btn:"#ff99cc" });
let userCardSerials = loadJSON(LS_KEYS.userCardSerials, {});

// --------------------
// DOMContentLoaded
// --------------------
document.addEventListener("DOMContentLoaded",()=>{
  const body=document.body;
  if(body.classList.contains("user")) initUser();
  if(body.classList.contains("admin")) initAdmin();
});

// --------------------
// ユーザー画面初期化
// --------------------
function initUser() {
  const userNameInput   = document.getElementById("userNameInput");
  const setNameBtn      = document.getElementById("setNameBtn");
  const addCardPassInput= document.getElementById("addCardPass");
  const addCardBtn      = document.getElementById("addCardBtn");
  const userCardsDiv    = document.getElementById("userCards");
  const stampHistoryList= document.getElementById("stampHistory");
  const textColorPicker = document.getElementById("textColor");
  const bgColorPicker   = document.getElementById("bgColor");
  const btnColorPicker  = document.getElementById("btnColor");

  // --------------------
  // ユーザー色の適用
  // --------------------
  function applyUserColors() {
    document.body.style.background = userUIColors.bg;
    document.body.style.color      = userUIColors.text;
    document.querySelectorAll("button").forEach(btn => {
      btn.style.background = userUIColors.btn;
      btn.style.color      = userUIColors.text;
    });
    userNameInput.style.color    = userUIColors.text;
    addCardPassInput.style.color = userUIColors.text;
  }

  textColorPicker?.addEventListener("input", () => { 
    userUIColors.text = textColorPicker.value; 
    saveAll(); 
    applyUserColors(); 
  });
  bgColorPicker?.addEventListener("input", () => { 
    userUIColors.bg = bgColorPicker.value; 
    saveAll(); 
    applyUserColors(); 
  });
  btnColorPicker?.addEventListener("input", () => { 
    userUIColors.btn = btnColorPicker.value; 
    saveAll(); 
    applyUserColors(); 
  });
  applyUserColors();

  userNameInput.value = userName || "";

  const userCardsTitle = document.createElement("h2");
  userCardsTitle.id = "userCardsTitle";
  userCardsTitle.style.marginBottom = "16px";
  userCardsDiv.parentNode.insertBefore(userCardsTitle, userCardsDiv);

  function updateUserCardsTitle() {
    userCardsTitle.textContent = userName ? `${userName}のスタンプカード` : "スタンプカード";
  }
  updateUserCardsTitle();

  setNameBtn.addEventListener("click", () => {
    const val = userNameInput.value.trim();
    if (!val) return alert("名前を入力してください");
    userName = val;
    saveAll();
    renderUserID();
    updateUserCardsTitle();
  });

  function renderUserID() {
    let el = document.getElementById("userIDDisplay");
    if (!el) {
      el = document.createElement("div"); 
      el.id = "userIDDisplay";
      el.style.position = "fixed";
      el.style.right    = "8px";
      el.style.bottom   = "8px";
      el.style.fontSize = "0.75em";
      el.style.color    = "#999";
      document.body.appendChild(el);
    }
    el.textContent = `ユーザー: ${userName}`;
  }
  renderUserID();

  addCardBtn.addEventListener("click", () => {
    const pass = addCardPassInput.value.trim();
    if (!pass) return alert("追加パスを入力してください");

    const matchedCard = cards.find(c => c.addPass === pass);
    if (!matchedCard) return alert("合言葉が違います");
    if (userAddedCards.includes(matchedCard.id)) return alert("このカードは既に追加済みです");

    userAddedCards.push(matchedCard.id);

    if (!userCardSerials[userName]) userCardSerials[userName] = {};
    if (!userCardSerials[userName][matchedCard.id]) {
      userCardSerials[userName][matchedCard.id] = String(Math.floor(Math.random()*1_000_000)).padStart(6,"0");
    }

    saveAll();
    addCardPassInput.value = "";
    renderUserCards();
    renderStampHistory();
  });

  // --------------------
  // カード描画＆不要カード削除
  // --------------------
  function renderUserCards() {
    userCardsDiv.innerHTML = "";

    // 不要カードの削除（存在しないカードは削除）
    userAddedCards = userAddedCards.filter(cid => cards.some(c => c.id === cid));

    // シリアルも削除
    for (const uname in userCardSerials) {
      if (userCardSerials[uname]) {
        for (const cid in userCardSerials[uname]) {
          if (!cards.some(c => c.id === cid)) {
            delete userCardSerials[uname][cid];
          }
        }
      }
    }

    // スタンプ履歴も削除
    userStampHistory = userStampHistory.filter(s => cards.some(c => c.id === s.cardId));

    saveAll();

    userAddedCards.forEach(cid => {
      const c = cards.find(x => x.id === cid);
      if (!c) return;

      const div = document.createElement("div");
      div.className = "card";
      div.style.background = c.bg || "#fff0f5";

      const nameDiv = document.createElement("div");
      nameDiv.textContent = c.name;
      div.appendChild(nameDiv);

      const slotsDiv = document.createElement("div");
      for (let i = 0; i < c.slots; i++) {
        const span = document.createElement("span");
        span.className = "stamp-slot";
        if (userStampHistory.find(s => s.cardId === cid && s.slot === i)) {
          span.classList.add("stamp-filled");
        }
        slotsDiv.appendChild(span);
      }
      div.appendChild(slotsDiv);

      // スタンプボタン＋シリアル＋消去
      const btnContainer = document.createElement("div");
      btnContainer.style.display = "flex";
      btnContainer.style.justifyContent = "space-between";
      btnContainer.style.alignItems = "center";
      btnContainer.style.marginTop = "8px";

      // スタンプ押すボタン
      const stampBtn = document.createElement("button");
      stampBtn.textContent = "スタンプ押す";
      stampBtn.addEventListener("click", () => {
        const inputPass = prompt("スタンプ合言葉を入力してください");
        if (!inputPass) return;

        let matched = keywords.find(k => k.cardId===cid && k.word===inputPass && k.enabled);
        if (!matched && c.addPass===inputPass) matched={cardId:cid, word:inputPass};
        if (!matched) return alert("合言葉が違います");

        if (userStampHistory.some(s => s.cardId===cid && s.word===inputPass)) {
          return alert("この合言葉では既に押しています");
        }

        const stampedCount = userStampHistory.filter(s => s.cardId===cid).length;
        if (stampedCount >= c.slots) {
          if (c.maxNotifyMsg) alert(c.maxNotifyMsg);
          return alert("もう押せません");
        }

        userStampHistory.push({ 
          cardId:cid, 
          slot:stampedCount, 
          word:inputPass, 
          datetime:new Date().toISOString() 
        });
        userStampHistory = userStampHistory.filter(s => cards.some(c => c.id===s.cardId));
        saveAll();
        renderUserCards();
        renderStampHistory();
        alert(c.notifyMsg||"スタンプを押しました！");
      });

      // シリアル番号
      const serialSpan = document.createElement("span");
      serialSpan.textContent = `シリアル: ${userCardSerials[userName]?.[cid]||"------"}`;
      serialSpan.style.fontSize = "0.85em";
      serialSpan.style.color = "#666";

      // ✅ ユーザー用「消去」ボタン（修正版：直接保存）
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "消去";
      deleteBtn.addEventListener("click", () => {
        if (!confirm("このカードを消去しますか？\n関連するスタンプ履歴も削除されます。")) return;

        // userAddedCards から削除
        userAddedCards = userAddedCards.filter(x => x !== cid);

        // スタンプ履歴から削除
        userStampHistory = userStampHistory.filter(s => s.cardId !== cid);

        // シリアル削除
        if (userCardSerials[userName] && userCardSerials[userName][cid]) {
          delete userCardSerials[userName][cid];
        }

        // 🔹 直接保存
        saveJSON(LS_KEYS.userAddedCards, userAddedCards);
        saveJSON(LS_KEYS.userStampHistory, userStampHistory);
        saveJSON(LS_KEYS.userCardSerials, userCardSerials);

        renderUserCards();
        renderStampHistory();
      });

      // ボタンを並べて配置
      btnContainer.appendChild(stampBtn);
      btnContainer.appendChild(serialSpan);
      btnContainer.appendChild(deleteBtn);

      div.appendChild(btnContainer);
      userCardsDiv.appendChild(div);
    });
  }

  function renderStampHistory() {
    stampHistoryList.innerHTML = "";
    userStampHistory.slice().reverse().forEach(s => {
      const cardExists = cards.find(c => c.id === s.cardId);
      if (!cardExists) return;
      const li = document.createElement("li");
      li.textContent = `${cardExists.name} 【合言葉:${s.word}】 ${new Date(s.datetime).toLocaleString()}`;
      stampHistoryList.appendChild(li);
    });
  }

  renderUserCards();
  renderStampHistory();

  const updateLogsList = document.getElementById("updateLogs");
  function renderUpdates() {
    updateLogsList.innerHTML = "";
    updates.forEach(u => {
      const li = document.createElement("li");
      li.textContent = `${u.date} ${u.msg}`;
      updateLogsList.appendChild(li);
    });
  }
  renderUpdates();
}

// --------------------
// 管理者画面初期化
// --------------------
function initAdmin(){
  const cardName       = document.getElementById("cardName");
  const cardSlots      = document.getElementById("cardSlots");
  const addPass        = document.getElementById("addPass");
  const notifyMsg      = document.getElementById("notifyMsg");
  const maxNotifyMsg   = document.getElementById("maxNotifyMsg");
  const cardBG         = document.getElementById("cardBG");
  const stampIcon      = document.getElementById("stampIcon");
  const previewCardBtn = document.getElementById("previewCardBtn");
  const previewClearBtn= document.getElementById("previewClearBtn");
  const createCardBtn  = document.getElementById("createCardBtn");
  const adminCardsList = document.getElementById("adminCards");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput   = document.getElementById("keywordInput");
  const addKeywordBtn  = document.getElementById("addKeywordBtn");
  const keywordList    = document.getElementById("keywordList");
  const updateInput    = document.getElementById("updateInput");
  const addUpdateBtn   = document.getElementById("addUpdateBtn");
  const adminUpdateLogs= document.getElementById("adminUpdateLogs");
  const previewArea    = document.getElementById("previewArea");

  // --------------------
  // 管理者カード表示更新
  // --------------------
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
        cards=cards.filter(x=>x.id!==c.id);
        userAddedCards=userAddedCards.filter(x=>x!==c.id);
        for(const uname in userCardSerials){
          if(userCardSerials[uname] && userCardSerials[uname][c.id]){
            delete userCardSerials[uname][c.id];
          }
        }
        userStampHistory=userStampHistory.filter(s=>s.cardId!==c.id);
        saveAll();
        renderAdminCards();
        renderKeywords();
      });
      li.appendChild(delBtn);

      adminCardsList.appendChild(li);

      const opt=document.createElement("option");
      opt.value=c.id; opt.textContent=c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  // --------------------
  // キーワード管理表示
  // --------------------
  function renderKeywords(){
    keywordList.innerHTML="";
    keywords.forEach((k,idx)=>{
      const li=document.createElement("li");
      const cName=cards.find(c=>c.id===k.cardId)?.name||k.cardId;
      const info=document.createElement("span");
      info.textContent=`${cName} : ${k.word} : 状態:${k.enabled?"有効":"無効"}`;
      li.appendChild(info);

      const toggleBtn=document.createElement("button");
      toggleBtn.textContent=k.enabled?"無効にする":"有効にする";
      toggleBtn.addEventListener("click",()=>{ k.enabled=!k.enabled; saveAll(); renderKeywords(); });
      li.appendChild(toggleBtn);

      const delBtn=document.createElement("button");
      delBtn.textContent="消去";
      delBtn.addEventListener("click",()=>{ keywords.splice(idx,1); saveAll(); renderKeywords(); });
      li.appendChild(delBtn);

      keywordList.appendChild(li);
    });
  }

  // --------------------
  // 更新履歴表示
  // --------------------
  function renderUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach((u,idx)=>{
      const li=document.createElement("li");
      li.textContent=`${u.date} ${u.msg}`;
      const delBtn=document.createElement("button");
      delBtn.textContent="削除";
      delBtn.addEventListener("click",()=>{ updates.splice(idx,1); saveAll(); renderUpdates(); });
      li.appendChild(delBtn);
      adminUpdateLogs.appendChild(li);
    });
  }

  // --------------------
  // プレビュー
  // --------------------
  previewCardBtn.addEventListener("click",()=>{
    const c={ name:cardName.value, slots:parseInt(cardSlots.value)||5, bg:cardBG.value, stampIcon:stampIcon.value };
    previewArea.innerHTML=`<div class="card" style="background:${c.bg}">${c.name}<br>`+
      Array.from({length:c.slots}).map(_=>`<span class="stamp-slot"></span>`).join("")+`</div>`;
  });
  previewClearBtn.addEventListener("click",()=>{ previewArea.innerHTML=""; });

  // --------------------
  // カード作成
  // --------------------
  createCardBtn.addEventListener("click",()=>{
    const id=`card_${Date.now()}`;
    cards.push({ id,name:cardName.value,slots:parseInt(cardSlots.value)||5,addPass:addPass.value,bg:cardBG.value,stampIcon:stampIcon.value,notifyMsg:notifyMsg.value,maxNotifyMsg:maxNotifyMsg.value });
    saveAll();
    renderAdminCards();
    renderKeywords();
  });

  // --------------------
  // キーワード追加
  // --------------------
  addKeywordBtn.addEventListener("click",()=>{
    if(!keywordInput.value) return;
    keywords.push({cardId:keywordCardSelect.value, word:keywordInput.value, enabled:true});
    keywordInput.value="";
    saveAll(); renderKeywords();
  });

  // --------------------
  // 更新履歴追加
  // --------------------
  addUpdateBtn.addEventListener("click",()=>{
    if(!updateInput.value) return;
    const now=new Date();
    updates.push({date:now.toLocaleString(), msg:updateInput.value});
    updateInput.value="";
    saveAll(); renderUpdates();
  });

  addCopyButton();

  renderAdminCards(); renderKeywords(); renderUpdates();
}

// --------------------
// コピー用ボタン生成（update.js形式でコピー）
// --------------------
function addCopyButton(){
  if(document.getElementById("copyUpdateDataBtn")) return;

  const container=document.createElement("div");
  container.style.margin="16px 0";
  container.style.textAlign="center";

  const btn=document.createElement("button");
  btn.id="copyUpdateDataBtn";
  btn.textContent="update.js形式でコピー";
  btn.style.padding="8px 16px";
  btn.style.fontSize="14px";

  btn.addEventListener("click", () => {
    // JSONデータを文字列化（インデント付き）
    const jsonText = JSON.stringify({ cards, keywords, updates }, null, 2);
    // update.js形式に整形
    const updateJsText = `// update.js
var update = ${jsonText};`;

    // クリップボードにコピー
    navigator.clipboard.writeText(updateJsText)
      .then(() => alert("update.js形式でコピーしました"))
      .catch(() => alert("コピーに失敗しました"));
  });

  container.appendChild(btn);
  document.body.prepend(container);
}