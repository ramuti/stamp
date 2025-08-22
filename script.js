// 共通データ
let cards = [];
let stampKeys = [];
let userStampHistory = [];
let updateHistory = [];

// -------------------- ユーザー画面 --------------------
const nameModal = document.getElementById("nameModal");
const usernameInput = document.getElementById("usernameInput");
const usernameOk = document.getElementById("usernameOk");
const displayName = document.getElementById("displayName");
const openNameModal = document.getElementById("openNameModal");

let username = "";

// 名前入力OK
usernameOk.addEventListener("click", () => {
  let val = usernameInput.value.trim();
  if (!val) {
    alert("名前を入力してください");
    return;
  }
  username = val;
  displayName.textContent = username + " のスタンプカード";
  nameModal.style.display = "none";
  usernameInput.value = "";
});

// デバッグ用
openNameModal.addEventListener("click", () => {
  nameModal.style.display = "block";
});

// カード追加
const addCardBtn = document.getElementById("addCardBtn");
const cardPassInput = document.getElementById("cardPassInput");
const cardsContainer = document.getElementById("cardsContainer");

addCardBtn.addEventListener("click", () => {
  let pass = cardPassInput.value.trim();
  if (!pass) {
    alert("追加パスを入力してください");
    return;
  }
  let card = cards.find(c => c.pass === pass);
  if (!card) {
    alert("パスに一致するカードがありません");
    return;
  }
  renderCards();
  cardPassInput.value = "";
});

function renderCards() {
  cardsContainer.innerHTML = "";
  cards.forEach((c, index) => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    const title = document.createElement("h3");
    title.textContent = c.title;
    cardDiv.appendChild(title);

    let totalFrames = c.frames;
    let rowDiv;
    for (let i = 0; i < totalFrames; i++) {
      if (i % 5 === 0) {
        rowDiv = document.createElement("div");
        rowDiv.className = "stamp-row";
        cardDiv.appendChild(rowDiv);
      }
      const cell = document.createElement("div");
      cell.className = "stamp-cell";
      rowDiv.appendChild(cell);
    }

    // スタンプボタン
    const btn = document.createElement("button");
    btn.textContent = "スタンプを押す";
    btn.addEventListener("click", () => {
      let key = prompt("合言葉を入力してください");
      if (!key) return;
      let k = stampKeys.find(s => s.cardTitle === c.title && s.key === key && s.active);
      if (!k) {
        alert("無効の合言葉です");
        return;
      }
      let already = userStampHistory.find(h => h.cardTitle === c.title && h.key === key);
      if (already) {
        alert("もう押してあります");
        return;
      }
      userStampHistory.push({cardTitle:c.title, key:key, date:new Date().toLocaleString()});
      alert("スタンプを押したよ");
      renderStampHistory();
    });
    cardDiv.appendChild(btn);

    cardsContainer.appendChild(cardDiv);
  });
}

const stampHistoryDiv = document.getElementById("stampHistory");
function renderStampHistory() {
  stampHistoryDiv.innerHTML = "";
  userStampHistory.forEach(h => {
    const p = document.createElement("p");
    p.textContent = `${h.cardTitle} ${h.date} に押しました`;
    stampHistoryDiv.appendChild(p);
  });
}

// 更新履歴
const updateLogsDiv = document.getElementById("updateLogs");
function renderUpdateLogs() {
  updateLogsDiv.innerHTML = "";
  updateHistory.forEach(log => {
    const p = document.createElement("p");
    p.textContent = log;
    updateLogsDiv.appendChild(p);
  });
}

// -------------------- 管理者画面 --------------------
const cardTitleInput = document.getElementById("cardTitle");
const cardFramesInput = document.getElementById("cardFrames");
const cardPassAdminInput = document.getElementById("cardPass");
const createCardBtn = document.getElementById("createCardBtn");
const cardListDiv = document.getElementById("cardList");
const targetCardSelect = document.getElementById("targetCard");
const stampKeyInput = document.getElementById("stampKeyInput");
const addStampKeyBtn = document.getElementById("addStampKeyBtn");
const stampKeyListDiv = document.getElementById("stampKeyList");
const updateInput = document.getElementById("updateInput");
const updateBtn = document.getElementById("updateBtn");

function renderCardList() {
  cardListDiv.innerHTML = "";
  targetCardSelect.innerHTML = "";
  cards.forEach((c, idx) => {
    const div = document.createElement("div");
    div.textContent = `カード名: ${c.title} | 追加パス: ${c.pass} | 枠数: ${c.frames}`;
    const delBtn = document.createElement("button");
    delBtn.textContent = "消去";
    delBtn.addEventListener("click", () => {
      cards.splice(idx,1);
      renderCardList();
    });
    div.appendChild(delBtn);
    cardListDiv.appendChild(div);

    // 対象カード選択
    const option = document.createElement("option");
    option.value = c.title;
    option.textContent = c.title;
    targetCardSelect.appendChild(option);
  });
}

createCardBtn.addEventListener("click", () => {
  const title = cardTitleInput.value.trim();
  const frames = parseInt(cardFramesInput.value);
  const pass = cardPassAdminInput.value.trim();
  if (!title || !frames || !pass) {
    alert("カード名・枠数・追加パスは必須です");
    return;
  }
  cards.push({title:title, frames:frames, pass:pass});
  renderCardList();
  cardTitleInput.value = "";
  cardFramesInput.value = "";
  cardPassAdminInput.value = "";
});

// スタンプ合言葉追加
function renderStampKeys() {
  stampKeyListDiv.innerHTML = "";
  stampKeys.forEach((s, idx) => {
    const div = document.createElement("div");
    div.textContent = `カード名: ${s.cardTitle} | 合言葉: ${s.key} | 状態: ${s.active ? "有効":"無効"}`;
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "切替";
    toggleBtn.addEventListener("click", () => {
      s.active = !s.active;
      renderStampKeys();
    });
    const delBtn = document.createElement("button");
    delBtn.textContent = "消去";
    delBtn.addEventListener("click", () => {
      stampKeys.splice(idx,1);
      renderStampKeys();
    });
    div.appendChild(toggleBtn);
    div.appendChild(delBtn);
    stampKeyListDiv.appendChild(div);
  });
}

addStampKeyBtn.addEventListener("click", () => {
  const cardTitle = targetCardSelect.value;
  const key = stampKeyInput.value.trim();
  if (!cardTitle || !key) return;
  if (stampKeys.find(s=>s.cardTitle===cardTitle && s.key===key)) {
    alert("既に存在する合言葉です");
    return;
  }
  stampKeys.push({cardTitle:cardTitle, key:key, active:true});
  renderStampKeys();
  stampKeyInput.value="";
});

// 更新履歴
updateBtn.addEventListener("click", () => {
  const val = updateInput.value.trim();
  if (!val) return;
  const log = new Date().toLocaleDateString() + " " + val;
  updateHistory.push(log);
  renderUpdateLogs();
  updateInput.value="";
});