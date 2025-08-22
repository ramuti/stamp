let userName = localStorage.getItem("userName") || "";
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let keywords = JSON.parse(localStorage.getItem("keywords")) || [];
let updates = JSON.parse(localStorage.getItem("updates")) || [];
let userStampHistory = JSON.parse(localStorage.getItem("userStampHistory")) || [];
let userCardAdded = JSON.parse(localStorage.getItem("userCardAdded")) || []; // 追加カード情報保持

function saveAll() {
  localStorage.setItem("userName", userName);
  localStorage.setItem("cards", JSON.stringify(cards));
  localStorage.setItem("keywords", JSON.stringify(keywords));
  localStorage.setItem("updates", JSON.stringify(updates));
  localStorage.setItem("userStampHistory", JSON.stringify(userStampHistory));
  localStorage.setItem("userCardAdded", JSON.stringify(userCardAdded));
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

    if (!userCardAdded.some(c=>c.id===card.id)) {
      userCardAdded.push({id: card.id, stamps: Array(card.slots).fill(false)});
      saveAll();
      renderUserCard(card);
    } else { alert("すでに追加済みです"); }
  };

  function renderUserCard(card) {
    const existingDiv = userCards.querySelector(`[data-id='${card.id}']`);
    if (existingDiv) return;

    const div = document.createElement("div");
    div.className = "card";
    div.dataset.id = card.id;

    const h3 = document.createElement("h3");
    h3.textContent = card.name;
    div.appendChild(h3);

    const userCard = userCardAdded.find(c=>c.id===card.id);
    const slotsDivs = [];
    for (let i = 0; i < card.slots; i++) {
      const slot = document.createElement("div");
      slot.className = "stamp-slot";
      if(userCard.stamps[i]){
        if(card.stampImg){ 
          slot.style.backgroundImage = `url(${card.stampImg})`;
          slot.style.backgroundSize = "cover";
        } else {
          slot.style.backgroundColor = "#ffcccc";
        }
      }
      slotsDivs.push(slot);
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
      const firstFalseIndex = userCard.stamps.findIndex(s=>!s);
      if(firstFalseIndex===-1){ alert("もう全て押されています"); return; }
      if (userStampHistory.some(s => s.cardId===card.id && s.keyword===keyword && s.slotIndex===firstFalseIndex)) {
        alert("すでに押されています"); return;
      }

      userCard.stamps[firstFalseIndex] = true;
      saveAll();

      if(card.stampImg){
        slotsDivs[firstFalseIndex].style.backgroundImage = `url(${card.stampImg})`;
        slotsDivs[firstFalseIndex].style.backgroundSize = "cover";
      } else {
        slotsDivs[firstFalseIndex].style.backgroundColor = "#ffcccc";
      }

      userStampHistory.push({
        cardId: card.id,
        keyword: keyword,
        date: new Date().toLocaleString(),
        slotIndex: firstFalseIndex
      });
      saveAll();

      alert(card.notifyMsg || "スタンプを押したよ");
      updateHistory();
    };
    div.appendChild(btn);

    userCards.appendChild(div);
  }

  function updateHistory() {
    historyList.innerHTML = "";
    userStampHistory.forEach(h => {
      const card = cards.find(c => c.id===h.cardId);
      if(card){
        const li = document.createElement("li");
        li.textContent = `${card.name}  ${h.date} に押しました`;
        historyList.appendChild(li);
      }
    });
    updateLogs.innerHTML = "";
    updates.forEach(u => {
      const div = document.createElement("div");
      div.textContent = u;
      updateLogs.appendChild(div);
    });
  }

  userCardAdded.forEach(c=>{
    const card = cards.find(cardItem=>cardItem.id===c.id);
    if(card) renderUserCard(card);
  });
  updateHistory();
}

// --- 管理者 ---
function initAdmin() {
  // ここはv9と同じ
  const cardName = document.getElementById("cardName");
  const cardSlots = document.getElementById("cardSlots");
  const notifyMsg = document.getElementById("notifyMsg");
  const maxNotifyMsg = document.getElementById("maxNotifyMsg");
  const addPass = document.getElementById("addPass");
  const createCardBtn = document.getElementById("createCardBtn");
  const adminCards = document.getElementById("adminCards");
  const keywordCardSelect = document.getElementById("keywordCardSelect");
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");
  const keywordList = document.getElementById("keywordList");
  const updateInput = document.getElementById("updateInput");
  const addUpdateBtn = document.getElementById("addUpdateBtn");
  const adminUpdateLogs = document.getElementById("adminUpdateLogs");

  function refreshCardList() {
    adminCards.innerHTML = "";
    cards.forEach(c => {
      const li = document.createElement("li");
      li.textContent = `${c.name} | ${c.addPass} | ${c.slots}`;
      const delBtn = document.createElement("button");
      delBtn.textContent = "消去";
      delBtn.onclick = () => {
        cards = cards.filter(x => x.id!==c.id);
        userCardAdded = userCardAdded.filter(x=>x.id!==c.id); // ユーザー側も削除
        saveAll();
        refreshCardList();
      };
      li.appendChild(delBtn);
      adminCards.appendChild(li);
    });

    keywordCardSelect.innerHTML = "";
    cards.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      keywordCardSelect.appendChild(opt);
    });
  }

  createCardBtn.onclick = () => {
    if (!cardName.value.trim() || !cardSlots.value || !addPass.value.trim()) {
      alert("カード名・枠数・追加パスは必須です");
      return;
    }
    const newCard = {
      id: Date.now(),
      name: cardName.value.trim(),
      slots: Number(cardSlots.value),
      notifyMsg: notifyMsg.value.trim(),
      maxNotifyMsg: maxNotifyMsg.value.trim(),
      addPass: addPass.value.trim(),
      added: false,
      stampImg: null
    };
    cards.push(newCard);
    saveAll();
    refreshCardList();
  };

  addKeywordBtn.onclick = () => {
    const cardId = Number(keywordCardSelect.value);
    const word = keywordInput.value.trim();
    if(!word) { alert("合言葉を入力してください"); return; }
    if(keywords.some(k=>k.cardId===cardId && k.word===word)) { alert("すでに存在"); return; }
    keywords.push({cardId: cardId, word: word, active:true});
    saveAll();
    refreshKeywords();
  };

  function refreshKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach(k=>{
      const li = document.createElement("li");
      const card = cards.find(c=>c.id===k.cardId);
      li.textContent = `${card ? card.name : ""} | ${k.word} | ${k.active?"有効":"無効"}`;
      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = "切替";
      toggleBtn.onclick = () => { k.active=!k.active; saveAll(); refreshKeywords(); };
      const delBtn = document.createElement("button");
      delBtn.textContent = "消去";
      delBtn.onclick = ()=>{ keywords = keywords.filter(x=>x!==k); saveAll(); refreshKeywords(); };
      li.appendChild(toggleBtn); li.appendChild(delBtn);
      keywordList.appendChild(li);
    });
  }

  addUpdateBtn.onclick = ()=>{
    if(updateInput.value.trim()){
      updates.push(updateInput.value.trim());
      saveAll();
      updateInput.value="";
      refreshUpdates();
    }
  };

  function refreshUpdates(){
    adminUpdateLogs.innerHTML="";
    updates.forEach(u=>{
      const div = document.createElement("div");
      div.textContent = u;
      adminUpdateLogs.appendChild(div);
    });
  }

  refreshCardList();
  refreshKeywords();
  refreshUpdates();
}