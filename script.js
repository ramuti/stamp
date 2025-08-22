// --- データ ---
let userName = localStorage.getItem("userName") || "";
let cards = JSON.parse(localStorage.getItem("cards")) || [];
let keywords = JSON.parse(localStorage.getItem("keywords")) || [];
let updates = JSON.parse(localStorage.getItem("updates")) || [];
let userStampHistory = JSON.parse(localStorage.getItem("userStampHistory")) || [];

// --- 保存 ---
function saveAll() {
  localStorage.setItem("userName", userName);
  localStorage.setItem("cards", JSON.stringify(cards));
  localStorage.setItem("keywords", JSON.stringify(keywords));
  localStorage.setItem("updates", JSON.stringify(updates));
  localStorage.setItem("userStampHistory", JSON.stringify(userStampHistory));
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
  function showNameModal() {
    userNameInput.value = userName;
    nameModal.style.display = "flex";
  }

  if (!userName) {
    showNameModal();
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

  // デバッグ用ボタンで名前入力モーダル表示
  if(debugNameBtn){
    debugNameBtn.onclick = showNameModal;
  }

  // カード追加
  addCardBtn.onclick = () => {
    const pass = addCardPass.value.trim();
    if (!pass) {
      alert("追加パスを入力してください");
      return;
    }
    const card = cards.find(c => c.addPass === pass);
    if (card) {
      alert("カードを追加しました！");
      renderUserCards();
    } else {
      alert("パスが間違っています");
    }
  };

  function renderUserCards() {
    userCards.innerHTML = "";
    cards.forEach((c, i) => {
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

// --- 管理者画面 ---
function initAdmin() {
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

  // カード作成
  createCardBtn.onclick = () => {
    if (!cardName.value.trim() || !cardSlots.value || !addPass.value.trim()) {
      alert("必須項目が未入力です");
      return;
    }
    const newCard = {
      id: Date.now(),
      name: cardName.value.trim(),
      slots: parseInt(cardSlots.value, 10),
      notify: notifyMsg.value.trim(),
      maxNotify: maxNotifyMsg.value.trim(),
      addPass: addPass.value.trim()
    };
    cards.push(newCard);
    saveAll();
    renderCards();
    renderCardSelect();
  };

  function renderCards() {
    adminCards.innerHTML = "";
    cards.forEach((c, i) => {
      const li = document.createElement("li");
      li.textContent = `${c.name} / パス: ${c.addPass} / 枠: ${c.slots}`;
      const del = document.createElement("button");
      del.textContent = "消去";
      del.onclick = () => {
        cards.splice(i, 1);
        keywords = keywords.filter(k => k.cardId !== c.id);
        userStampHistory = userStampHistory.filter(h => !h.startsWith(c.id + "_"));
        saveAll();
        renderCards();
        renderCardSelect();
        renderKeywords();
      };
      li.appendChild(del);
      adminCards.appendChild(li);
    });
  }

  function renderCardSelect() {
    keywordCardSelect.innerHTML = "";
    cards.forEach(c => {
      const op = document.createElement("option");
      op.value = c.id;
      op.textContent = c.name;
      keywordCardSelect.appendChild(op);
    });
  }

  // 合言葉作成
  addKeywordBtn.onclick = () => {
    const kwValue = keywordInput.value.trim();
    const cardId = parseInt(keywordCardSelect.value, 10);
    if (!kwValue) return;
    const exists = keywords.find(k => k.cardId === cardId && k.word === kwValue);
    if (exists) {
      alert("すでに存在する合言葉です");
      return;
    }
    const kw = {
      cardId: cardId,
      word: kwValue,
      enabled: true
    };
    keywords.push(kw);
    saveAll();
    renderKeywords();
  };

  function renderKeywords() {
    keywordList.innerHTML = "";
    keywords.forEach((k, i) => {
      const li = document.createElement("li");
      const card = cards.find(c => c.id === k.cardId);
      li.textContent = `${card?.name}・${k.word}・状態:${k.enabled ? "有効" : "無効"}`;
      const toggle = document.createElement("button");
      toggle.textContent = "切替";
      toggle.onclick = () => {
        k.enabled = !k.enabled;
        saveAll();
        renderKeywords();
      };
      const del = document.createElement("button");
      del.textContent = "消去";
      del.onclick = () => {
        keywords.splice(i, 1);
        saveAll();
        renderKeywords();
      };
      li.appendChild(toggle);
      li.appendChild(del);
      keywordList.appendChild(li);
    });
  }

  // 更新履歴
  addUpdateBtn.onclick = () => {
    if (!updateInput.value.trim()) return;
    updates.push(updateInput.value.trim());
    saveAll();
    renderUpdates();
  };

  function renderUpdates() {
    adminUpdateLogs.innerHTML = updates.join("<br>");
  }

  renderCards();
  renderCardSelect();
  renderKeywords();
  renderUpdates();
}