// 共通データ
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let secrets = JSON.parse(localStorage.getItem("secrets")) || {};
let updates = JSON.parse(localStorage.getItem("updates")) || [];
let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = localStorage.getItem("currentUser") || "";

// ユーザー名入力ダイアログ
function showUserNameDialog() {
  const dialog = document.getElementById("userNameDialog");
  const okBtn = document.getElementById("okUserName");
  if(!currentUser && dialog){
    dialog.style.display = "flex";
    okBtn.onclick = ()=>{
      const name = document.getElementById("userNameInput").value.trim();
      if(!name) return alert("入力必須です");
      currentUser = name;
      localStorage.setItem("currentUser", currentUser);
      users[currentUser] = users[currentUser] || {};
      localStorage.setItem("users", JSON.stringify(users));
      dialog.style.display = "none";
      renderUserTitle();
      renderUserCards();
      renderUserUpdates();
    };
  } else {
    renderUserTitle();
    renderUserCards();
    renderUserUpdates();
  }
}

// ユーザー画面タイトル表示
function renderUserTitle() {
  const titleEl = document.getElementById("userTitle");
  if(titleEl) titleEl.textContent = `${currentUser}のスタンプカード`;
}

// 管理者初期化
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
    if(!list) return;
    list.innerHTML="";
    cards.forEach((c, idx)=>{
      const div = document.createElement("div");
      div.className="card";
      div.innerHTML = `
        <div class="cardTitle">${c.title}</div>
        <div>追加パス: ${c.pass}</div>
        <div>枠数: ${c.slots}</div>
        <button onclick="deleteCard(${idx})">消去</button>
      `;
      list.appendChild(div);
    });

    if(selectCard){
      selectCard.innerHTML="";
      cards.forEach((c, idx)=>{
        const opt = document.createElement("option");
        opt.value = idx;
        opt.textContent = c.title;
        selectCard.appendChild(opt);
      });
    }
  }

  createCardBtn.onclick = ()=>{
    const title = cardTitle.value.trim();
    const pass = cardPass.value.trim();
    const slots = parseInt(cardSlots.value);
    if(!title || !pass || !slots) return alert("必須項目を入力してください");

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

  window.deleteCard = function(idx){
    const card = cards[idx];
    if(card){
      cards.splice(idx,1);
      delete secrets[card.title];
      localStorage.setItem("cards", JSON.stringify(cards));
      localStorage.setItem("secrets", JSON.stringify(secrets));
      renderAdminCards();
    }
  };

  renderAdminCards();
}

// スタンプ合言葉管理
function secretInit() {
  const addBtn = document.getElementById("addSecretBtn");
  const toggleBtn = document.getElementById("toggleSecretBtn");
  const deleteBtn = document.getElementById("deleteSecretBtn");
  const selectCard = document.getElementById("selectCard");
  const inputSecret = document.getElementById("stampSecretInput");

  addBtn.onclick = ()=>{
    const idx = selectCard.value;
    const card = cards[idx];
    if(!card) return alert("カードを選択してください");
    const secret = inputSecret.value.trim();
    if(!secret) return alert("合言葉を入力してください");
    secrets[card.title] = secrets[card.title] || [];
    secrets[card.title].push({secret, active:true});
    localStorage.setItem("secrets", JSON.stringify(secrets));
    inputSecret.value="";
    alert("合言葉追加しました");
  };

  toggleBtn.onclick = ()=>{
    const idx = selectCard.value;
    const card = cards[idx];
    if(!card || !secrets[card.title]) return;
    secrets[card.title].forEach(s=>s.active=!s.active);
    localStorage.setItem("secrets", JSON.stringify(secrets));
    alert("合言葉状態を切替しました");
  };

  deleteBtn.onclick = ()=>{
    const idx = selectCard.value;
    const card = cards[idx];
    if(!card) return;
    delete secrets[card.title];
    localStorage.setItem("secrets", JSON.stringify(secrets));
    alert("合言葉削除しました");
  };
}

// 更新履歴管理
function updateInit() {
  const input = document.getElementById("updateInput");
  const addBtn = document.getElementById("addUpdateBtn");
  addBtn.onclick = ()=>{
    const text = input.value.trim();
    if(!text) return;
    const date = new Date().toISOString().split("T")[0];
    updates.push(`${date} ${text}`);
    localStorage.setItem("updates", JSON.stringify(updates));
    input.value="";
    renderUpdates();
  };
  renderUpdates();
}

function renderUpdates() {
  const list = document.getElementById("updateList");
  if(!list) return;
  list.innerHTML="";
  updates.forEach(u=>{
    const div = document.createElement("div");
    div.textContent = u;
    list.appendChild(div);
  });
}

// ユーザーカード描画
function renderUserCards() {
  const container = document.getElementById("userCards");
  if(!container) return;
  container.innerHTML="";
  cards.forEach(c=>{
    const userData = users[currentUser][c.title] || {stamps:0};
    users[currentUser][c.title] = userData;
    const cardDiv = document.createElement("div");
    cardDiv.className="userCard";
    if(c.bg) cardDiv.style.backgroundImage = `url(${c.bg})`;

    const rows = Math.ceil(c.slots/5);
    let slotsHtml="";
    for(let i=0;i<rows;i++){
      slotsHtml+='<div class="stampRow">';
      for(let j=0;j<5;j++){
        const idx=i*5+j;
        if(idx>=c.slots) break;
        const stamped = idx<userData.stamps ? "stamped" : "";
        slotsHtml+=`<div class="stampSlot ${stamped}"></div>`;
      }
      slotsHtml+='</div>';
    }

    cardDiv.innerHTML=`
      <h3>${c.title}</h3>
      ${slotsHtml}
      <button class="stampButton" onclick="pressStamp('${c.title}')">スタンプを押す</button>
      <div class="serialNumber">${("0000"+Math.floor(Math.random()*10000)).slice(-5)}</div>
    `;
    container.appendChild(cardDiv);
  });
  localStorage.setItem("users", JSON.stringify(users));
}

// スタンプ押下処理
function pressStamp(title) {
  const input = prompt("合言葉を入力してください");
  if(!input) return;
  const card = cards.find(c=>c.title===title);
  if(!card) return alert("無効のカードです");
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

// ユーザー更新履歴
function renderUserUpdates() {
  const container = document.getElementById("userUpdateList");
  if(!container) return;
  container.innerHTML="";
  updates.forEach(u=>{
    const div = document.createElement("div");
    div.textContent = u;
    container.appendChild(div);
  });
}

// ユーザー画面カード追加
document.addEventListener("DOMContentLoaded",()=>{
  const addBtn = document.getElementById("userAddCardBtn");
  addBtn.onclick = ()=>{
    const pass = document.getElementById("userAddPass").value.trim();
    if(!pass) return alert("パスを入力してください");
    const card = cards.find(c=>c.pass===pass);
    if(!card) return alert("パスが違います");
    const userCardsData = users[currentUser];
    if(userCardsData[card.title]) return alert("既に追加済み");
    users[currentUser][card.title] = {stamps:0};
    localStorage.setItem("users", JSON.stringify(users));
    renderUserCards();
    document.getElementById("userAddPass").value="";
  };
});

// 初期化
document.addEventListener("DOMContentLoaded",()=>{
  adminInit && adminInit();
  secretInit && secretInit();
  updateInit && updateInit();
  showUserNameDialog();
});