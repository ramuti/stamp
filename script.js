let userName = localStorage.getItem("userName") || "";
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let keywords = JSON.parse(localStorage.getItem("keywords")) || [];
let updates = JSON.parse(localStorage.getItem("updates")) || [];
let userStampHistory = JSON.parse(localStorage.getItem("userStampHistory")) || [];

function saveAll() {
  localStorage.setItem("userName", userName);
  localStorage.setItem("cards", JSON.stringify(cards));
  localStorage.setItem("keywords", JSON.stringify(keywords));
  localStorage.setItem("updates", JSON.stringify(updates));
  localStorage.setItem("userStampHistory", JSON.stringify(userStampHistory));
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("setNameBtn")) initUser();
  if (document.getElementById("createCardBtn")) initAdmin();
});

// --- ユーザー ---
function initUser() {
  const nameModal = document.getElementById("nameModal");
  const setNameBtn = document.getElementById("setNameBtn");
  const userNameInput = document.getElementById("userNameInput");
  const cardTitle = document.getElementById("cardTitle");
  const addCardBtn = document.getElementById("addCardBtn");
  const addCardPass = document.getElementById("addCardPass");
  const userCards = document.getElementById("userCards");
  const historyList = document.getElementById("stampHistory");
  const updateLogs = document.getElementById("updateLogs");
  const debugNameBtn = document.getElementById("debugNameBtn");

  function showNameModal() {
    userNameInput.value = userName;
    nameModal.style.display = "flex";
  }

  if (!userName) showNameModal();
  else cardTitle.textContent = `${userName}のスタンプカード`;

  setNameBtn.onclick = () => {
    if (userNameInput.value.trim()) {
      userName = userNameInput.value.trim();
      saveAll();
      cardTitle.textContent = `${userName}のスタンプカード`;
      nameModal.style.display = "none";
    }
  };

  debugNameBtn.onclick = showNameModal;

  addCardBtn.onclick = () => {
    const pass = addCardPass.value.trim();
    if (!pass) { alert("追加パスを入力してください"); return; }
    const card = cards.find(c => c.addPass === pass);
    if (!card) { alert("パスが間違っています"); return; }
    if (!userCards.querySelector(`[data-id='${card.id}']`)) {
      renderUserCard(card);
    } else { alert("すでに追加済みです"); }
  };

  function renderUserCard(card) {
    const div = document.createElement("div");
    div.className = "card";
    div.dataset.id = card.id;
    div.innerHTML = `<h3>${card.name}</h3>`;
    for (let i = 0; i < card.slots; i++) {
      const slot = document.createElement("div");
      slot.className = "stamp-slot";
      div.appendChild(slot);
    }
    const serial = document.createElement("div");
    serial.className = "serial";
    serial.textContent = "00001";
    div.appendChild(serial);

    const btn = document.createElement("button");
    btn.textContent = "スタンプを押す";
    btn.onclick = () => {
      const keyword = prompt("合言葉を入力してください");
      if (!keyword) return;
      const keywordObj = keywords.find(k => k.cardId === card.id && k.word === keyword && k.active);
      if (!keywordObj) { alert("合言葉が違うか無効です"); return; }
      // すでに履歴にあれば押せない
      if (userStampHistory.some(s => s.cardId===card.id && s.keyword===keyword)) {
        alert("すでに押されています"); return;
      }
      userStampHistory.push({cardId: card.id, cardName: card.name, keyword, time: new Date().toLocaleString()});
      saveAll();
      alert("スタンプを押したよ");
      renderStampHistory();
    };
    div.appendChild(btn);
    userCards.appendChild(div);
  }

  function renderStampHistory() {
    historyList.innerHTML = "";
    userStampHistory.forEach(s => {
      const li = document.createElement("li");
      li.textContent = `${s.cardName} ${s.time} に押しました`;
      historyList.appendChild(li);
    });
  }

  function renderUpdates() {
    updateLogs.innerHTML = "";
    updates.forEach(u => {
      const div = document.createElement("div");
      div.textContent = u;
      updateLogs.appendChild(div);
    });
  }

  renderStampHistory();
  renderUpdates();
}

// --- 管理者 ---
function initAdmin() {
  const cardNameInput = document.getElementById("cardName");
  const cardSlotsInput = document.getElementById("cardSlots");
  const notifyMsgInput = document.getElementById("notifyMsg");
  const maxNotifyMsgInput = document.getElementById("maxNotifyMsg");
  const addPassInput = document.getElementById("addPass");
  const createCardBtn = document.getElementById("createCardBtn");
  const adminCardsList = document.getElementById("adminCards");

  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");

  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  createCardBtn.onclick = () => {
    const name = cardNameInput.value.trim();
    const slots = parseInt(cardSlotsInput.value);
    const addPass = addPassInput.value.trim();
    if (!name || !slots || !addPass) { alert("カード名・枠数・追加パスは必須です"); return; }
    const card = {id: Date.now(), name, slots, addPass, notifyMsg: notifyMsgInput.value||"スタンプを押したよ", maxNotifyMsg: maxNotifyMsgInput.value||"スタンプがMAXになりました"};
    cards.push(card); saveAll(); renderAdminCards();
  };

  function renderAdminCards() {
    adminCardsList.innerHTML = "";
    cards.forEach(c=>{
      const li=document.createElement("li");
      li.textContent=`カード名:${c.name} 追加パス:${c.addPass} 枠:${c.slots}`;
      adminCardsList.appendChild(li);
    });
    if (keywordCardSelect) {
      keywordCardSelect.innerHTML="";
      cards.forEach(c=>{
        const option=document.createElement("option");
        option.value=c.id; option.textContent=c.name;
        keywordCardSelect.appendChild(option);
      });
    }
  }

  addKeywordBtn.onclick = () => {
    const cardId=parseInt(keywordCardSelect.value);
    const word=keywordInput.value.trim();
    if(!word){alert("合言葉を入力してください");return;}
    if(keywords.some(k=>k.cardId===cardId&&k.word===word)){alert("すでに存在します");return;}
    keywords.push({cardId,word,active:true});
    saveAll(); renderKeywords();
  };

  function renderKeywords() {
    keywordList.innerHTML="";
    keywords.forEach(k=>{
      const li=document.createElement("li");
      const card=cards.find(c=>c.id===k.cardId);
      li.textContent=`カード:${card?card.name:"-"} 合言葉:${k.word} 状態:${k.active?"有効":"無効"}`;
      keywordList.appendChild(li);
    });
  }

  addUpdateBtn.onclick = () => {
    const val = updateInput.value.trim();
    if(!val)return;
    const log = `${new Date().toLocaleDateString()} ${val}`;
    updates.push(log); saveAll(); renderAdminUpdates();
  };

  function renderAdminUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const div=document.createElement("div");
      div.textContent=u;
      adminUpdateLogs.appendChild(div);
    });
  }

  renderAdminCards();
  renderKeywords();
  renderAdminUpdates();
}