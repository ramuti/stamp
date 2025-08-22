// --- データ ---
let userName = localStorage.getItem("userName") || "";
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let keywords = JSON.parse(localStorage.getItem("keywords")) || [];
let updates = JSON.parse(localStorage.getItem("updates")) || [];
let userStampHistory = JSON.parse(localStorage.getItem("userStampHistory")) || [];
let userAddedCards = JSON.parse(localStorage.getItem("userAddedCards")) || []; // 追加済カードID

// --- 保存 ---
function saveAll() {
  localStorage.setItem("userName", userName);
  localStorage.setItem("cards", JSON.stringify(cards));
  localStorage.setItem("keywords", JSON.stringify(keywords));
  localStorage.setItem("updates", JSON.stringify(updates));
  localStorage.setItem("userStampHistory", JSON.stringify(userStampHistory));
  localStorage.setItem("userAddedCards", JSON.stringify(userAddedCards));
}

// --- 初期化 ---
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("setNameBtn")) initUser();
  if (document.getElementById("createCardBtn")) initAdmin();
});

// --- ユーザー画面 ---
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
  const debugNameBtn = document.getElementById("debugNameBtn"); // デバッグ用

  // 初回名前入力
  if (!userName) {
    nameModal.style.display = "flex";
  } else {
    cardTitle.textContent = `${userName}のスタンプカード`;
  }

  setNameBtn.onclick = () => {
    if (userNameInput.value.trim()) {
      userName = userNameInput.value.trim();
      saveAll();
      cardTitle.textContent = `${userName}のスタンプカード`;
      nameModal.style.display = "none";
    }
  };

  // デバッグ用：名前入力モーダルを呼び出す
  if(debugNameBtn){
    debugNameBtn.onclick = () => {
      userNameInput.value = userName;
      nameModal.style.display = "flex";
    };
  }

  // カード追加
  addCardBtn.onclick = () => {
    const pass = addCardPass.value.trim();
    if (!pass) {
      alert("追加パスを入力してください");
      return;
    }
    const card = cards.find(c => c.addPass === pass);
    if (!card) {
      alert("パスが間違っています");
      return;
    }
    // 既に追加済みカードは追加不可
    if (userAddedCards.includes(card.id)) {
      alert("このカードはすでに追加されています");
      return;
    }
    userAddedCards.push(card.id);
    saveAll();
    alert("カードを追加しました！");
    renderUserCards();
  };

  function renderUserCards() {
    userCards.innerHTML = "";
    userAddedCards.forEach((cardId, i) => {
      const c = cards.find(cd => cd.id === cardId);
      if (!c) return;
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `<h3>${c.name}</h3>`;
      for (let j = 0; j < c.slots; j++) {
        const slot = document.createElement("div");
        slot.className = "stamp-slot";
        div.appendChild(slot);
      }
      const btn = document.createElement("button");
      btn.textContent = "スタンプを押す";
      btn.onclick = () => {
        const kw = prompt("合言葉を入力してください");
        const targetKeyword = keywords.find(
          k => k.word === kw && k.cardId === c.id && k.enabled
        );
        if (targetKeyword) {
          const historyKey = `${c.id}_${kw}`;
          if (userStampHistory.includes(historyKey)) {
            alert("もう押してあるよ");
            return;
          }
          alert(c.notify || "スタンプを押したよ");
          userStampHistory.push(historyKey);
          saveAll();
          renderStampHistory();
        } else {
          alert("無効の合言葉だよ");
        }
      };
      div.appendChild(btn);

      const serial = document.createElement("div");
      serial.className = "serial";
      serial.textContent = String(i + 1).padStart(5, "0");
      div.appendChild(serial);

      userCards.appendChild(div);
    });
  }

  function renderStampHistory() {
    historyList.innerHTML = "";
    userStampHistory.forEach(h => {
      const [cardId, word] = h.split("_");
      const card = cards.find(c => c.id == cardId);
      const li = document.createElement("li");
      const dt = new Date();
      li.textContent = `${card?.name}：${word} を ${dt.toLocaleString()} に押しました`;
      historyList.appendChild(li);
    });
  }

  function renderUpdates() {
    updateLogs.innerHTML = updates.join("<br>");
  }

  renderUserCards();
  renderStampHistory();
  renderUpdates();
}

// --- 管理者画面 --- (このコードは変更なし)
function initAdmin() {
  // ... (前回の管理者画面コードそのまま)
}