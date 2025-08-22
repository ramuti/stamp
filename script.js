// 共通データ
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let secrets = JSON.parse(localStorage.getItem("secrets")) || {};
let updates = JSON.parse(localStorage.getItem("updates")) || [];
let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = localStorage.getItem("currentUser") || "";

// -------------------
// ユーザー名入力ダイアログ
// -------------------
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

// -------------------
// ユーザー画面タイトル表示
// -------------------
function renderUserTitle() {
  const titleEl = document.getElementById("userTitle");
  if(titleEl) titleEl.textContent = `${currentUser}のスタンプカード`;
}

// -------------------
// 管理者初期化
// -------------------
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

// -------------------
// DOMContentLoaded 初期化
// -------------------
document.addEventListener("DOMContentLoaded",()=>{
  adminInit && adminInit();
  showUserNameDialog();
});