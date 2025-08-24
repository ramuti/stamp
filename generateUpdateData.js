/* ============================
   generateUpdateData.js — 管理者用コピー補助
   - script.js の下に読み込む
   - 画面にコピーボタンを出すだけ
   ============================ */

(function() {
  // コピー用ボタンを画面に表示
  function createCopyButton() {
    // すでにある場合はスキップ
    if (document.getElementById("copyUpdateDataBtn")) return;

    const container = document.createElement("div");
    container.style.margin = "16px 0";
    container.style.textAlign = "center";

    const btn = document.createElement("button");
    btn.id = "copyUpdateDataBtn";
    btn.textContent = "カード・合言葉データをコピー";
    btn.style.padding = "8px 16px";
    btn.style.fontSize = "14px";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", () => {
      // generateUpdateData関数が存在する場合のみコピー
      if (typeof generateUpdateData === "function") {
        const dataStr = generateUpdateData(); // 文字列を生成
        navigator.clipboard.writeText(dataStr)
          .then(() => alert("コピーしました！\nこの内容を generateUpdateData.js に上書きコミットしてください"))
          .catch(err => alert("コピー失敗: " + err));
      } else {
        alert("generateUpdateData 関数が定義されていません");
      }
    });

    container.appendChild(btn);

    // 管理者画面の上部に追加（#adminUpdateLogs の前）
    const adminArea = document.getElementById("adminUpdateLogs");
    if (adminArea && adminArea.parentNode) {
      adminArea.parentNode.insertBefore(container, adminArea);
    } else {
      document.body.appendChild(container);
    }
  }

  // DOM が読み込まれたらボタンを追加
  document.addEventListener("DOMContentLoaded", createCopyButton);

})();