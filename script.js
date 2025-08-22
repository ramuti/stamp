// ────────────── 共通データ ──────────────
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let secrets = JSON.parse(localStorage.getItem("secrets")) || {};
let updates = JSON.parse(localStorage.getItem("updates")) || [];
let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = localStorage.getItem("currentUser") || "";

// ────────────── ユーザー名初回入力 ──────────────
function showUserNameDialog() {
  const dialog = document.getElementById("userNameDialog");
  if (!currentUser && dialog) {
    dialog.style.display = "flex";
    document.getElementById("okUserName").onclick = () => {
      const name = document.getElementById("userNameInput").value.trim();
      if (!name) return alert("入力必須です");
      currentUser = name;
      localStorage.setItem("currentUser", currentUser);
      users[currentUser] = users[currentUser] || {};
      localStorage.setItem("users", JSON.stringify(users));
      dialog.style.display = "none";
      renderUserCards();
      renderUserTitle();
      renderUserUpdates();
    };
  } else {
    renderUserCards();
    renderUserTitle();
    renderUserUpdates();
  }
}

function renderUserTitle() {
  const titleEl = document.getElementById("userTitle");
  if (titleEl) titleEl.textContent = `${currentUser} : のスタンプカード`;
}

// ────────────── 管理者カード作成 ──────────────
function adminInit() {
  const cardTitle = document.getElementById("cardTitle");
  const cardPass = document.getElementById("cardPass");
  const cardSlots = document.getElementById("cardSlots");
  const notifyText = document.getElementById("notifyText");
  const maxNotifyText = document.getElementById("maxNotifyText");
  const createCardBtn = document.getElementById("createCardBtn");
  const bgInput = document.getElementById("bgImageInput");
  const stampInput = document.getElementById("stampImageInput");
  const selectCard = document.getElementById("selectCard");

  function renderAdminCards() {
    const list = document.getElementById("cardsList");
    if (!list) return;
    list.innerHTML = "";
    cards.forEach((c, idx) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <div class="cardTitle">${c.title}</div>
        <div>追加パス: ${c.pass}</div>
        <div>枠数: ${c.slots}</div>
        <button onclick="deleteCard(${idx})">消去</button>
      `;
      list.appendChild(div);
    });

    if (selectCard) {
      selectCard.innerHTML = "";
      cards.forEach((c, idx) => {
        const opt = document.createElement("option");
        opt.value = idx;
        opt.textContent = c.title;
        selectCard.appendChild(opt);
      });
    }
  }

  createCardBtn.onclick = () => {
    const title = cardTitle.value.trim();
    const pass = cardPass.value.trim();
    const slots = parseInt(cardSlots.value);
    if (!title || !pass || !slots) return alert("必須項目を入力してください");

    const bgURL = bgInput.files[0] ? URL.createObjectURL(bgInput.files[0]) : "";
    const stampURL = stampInput.files[0] ? URL.createObjectURL(stampInput.files[0]) : "";

    const newCard = {
      title,
      pass,
      slots,
      notify: notifyText.value || "スタンプを押したよ",
      maxNotify: maxNotifyText.value || "スタンプがMAXになりました スクショして管理者にお知らせしましょう",
      bg: bgURL,
      stamp: stampURL
    };
    cards.push(newCard);
    localStorage.setItem("cards", JSON.stringify(cards));
    renderAdminCards();
    cardTitle.value = cardPass.value = cardSlots.value = notifyText.value = maxNotifyText.value = "";
    bgInput.value = stampInput.value = "";
  };

  window.deleteCard = function(idx) {
    const card = cards[idx];
    if (card) {
      cards.splice(idx,1);
      // カード削除時に該当合言葉も消す
      delete secrets[card.title];
      localStorage.setItem("cards", JSON.stringify(cards));
      localStorage.setItem("secrets", JSON.stringify(secrets));
      renderAdminCards();
    }
  };

  renderAdminCards();
}

// ────────────── スタンプ合言葉管理 ──────────────
function secretInit() {
  const addBtn = document.getElementById("addSecretBtn");
  const toggleBtn = document.getElementById("toggleSecretBtn");
  const deleteBtn = document.getElementById("deleteSecretBtn");
  const selectCard = document.getElementById("selectCard");
  const inputSecret = document.getElementById("stampSecretInput");

  function updateSecretsUI() {
    // 将来的に一覧表示なども可能
  }

  addBtn.onclick = () => {
    const idx = selectCard.value;
    const card = cards[idx];
    if (!card) return alert("カードを選択してください");
    const secret = inputSecret.value.trim();
    if (!secret) return alert("合言葉を入力してください");
    secrets[card.title] = secrets[card.title] || [];
    secrets[card.title].push({secret, active:true});
    localStorage.setItem("secrets", JSON.stringify(secrets));
    inputSecret.value = "";
    updateSecretsUI();
    alert("合言葉追加しました");
  };

  toggleBtn.onclick = () => {
    const idx = selectCard.value;
    const card = cards[idx];
    if (!card || !secrets[card.title] || !secrets[card.title][0]) return;
    secrets[card.title][0].active = !secrets[card.title][0].active;
    localStorage.setItem("secrets", JSON.stringify(secrets));
    alert(`合言葉を${secrets[card.title][0].active ? "有効" : "無効"}にしました`);
  };

  deleteBtn.onclick = () => {
    const idx = selectCard.value;
    const card = cards[idx];
    if (!card || !secrets[card.title]) return;
    delete secrets[card.title];
    localStorage.setItem("secrets", JSON.stringify(secrets));
    alert("合言葉削除しました");
  };
}

// ────────────── 更新履歴管理 ──────────────
function updateInit() {
  const input = document.getElementById("updateInput");
  const btn = document.getElementById("addUpdateBtn");
  const list = document.getElementById("updateList");
  function renderUpdates() {
    if (!list) return;
    list.innerHTML = "";
    updates.forEach(u=>{
      const div = document.createElement("div");
      div.textContent = u;
      list.appendChild(div);
    });
  }
  btn.onclick = () => {
    if (!input.value.trim()) return;
    const text = `${new Date().toLocaleDateString()} ${input.value.trim()}`;
    updates.push(text);
    localStorage.setItem("updates", JSON.stringify(updates));
    input.value = "";
    renderUpdates();
  };
  renderUpdates();
}

// ────────────── ユーザー画面 ──────────────
function renderUserCards() {
  const container = document.getElementById("userCards");
  if (!container) return;
  container.innerHTML = "";
  cards.forEach(c=>{
    if (!users[currentUser][c.title]) users[currentUser][c.title] = {stamps:0};
    const cardDiv = document.createElement("div");
    cardDiv.className = "userCard";
    cardDiv.style.backgroundImage = c.bg ? `url(${c.bg})` : "";
    const rows = [];
    const fullRows = Math.ceil(c.slots/5);
    for(let r=0;r<fullRows;r++){
      const row = document.createElement("div");
      row.className="stampRow";
      for(let s=0;s<5;s++){
        const idx = r*5+s;
        if(idx>=c.slots) break;
        const slot = document.createElement("div");
        slot.className="stampSlot";
        if(idx<users[currentUser][c.title].stamps) slot.classList.add("stamped");
        row.appendChild(slot);
      }
      cardDiv.appendChild(row);
    }
    const btn = document.createElement("button");
    btn.className="stampButton";
    btn.textContent="スタンプを押す";
    btn.onclick = ()=>handleStamp(c);
    cardDiv.appendChild(btn);

    const serial = document.createElement("div");
    serial.className="serialNumber";
    serial.textContent="00001";
    cardDiv.appendChild(serial);

    container.appendChild(cardDiv);
  });
}

function handleStamp(card){
  const input = prompt("合言葉を入力してください");
  if(!input) return;
  const cardSecrets = secrets[card.title];
  if(!cardSecrets) return alert("無効の合言葉です");
  const valid = cardSecrets.find(s=>s.secret===input && s.active);
  if(!valid) return alert("合言葉が違うか無効です");
  const userData = users[currentUser][card.title];
  if(userData.stamps>=card.slots) return alert(card.maxNotify);
  userData.stamps++;
  localStorage.setItem("users", JSON.stringify(users));
  alert(card.notify);
  renderUserCards();
}

function renderUserUpdates() {
  const container = document.getElementById("userUpdateList");
  if(!container) return;
  container.innerHTML = "";
  updates.forEach(u=>{
    const div = document.createElement("div");
    div.textContent = u;
    container.appendChild(div);
  });
}

// ────────────── 初期化 ──────────────
document.addEventListener("DOMContentLoaded",()=>{
  adminInit && adminInit();
  secretInit && secretInit();
  updateInit && updateInit();
  showUserNameDialog();
});