/* ============================
   generateUpdateData.js — 管理者用コピー補助（安定版）
   - script.js の下に読み込む
   - 他の機能を壊さないように最小限
============================ */

(function() {
  // すでに存在する場合は上書きしない
  if (typeof window.generateUpdateData !== "function") {
    window.generateUpdateData = function() {
      try {
        const cards = localStorage.getItem("cards") || "[]";
        const keywords = localStorage.getItem("keywords") || "[]";
        return `/* カード */\n${cards}\n/* キーワード */\n${keywords}`;
      } catch (e) {
        console.error("generateUpdateData error:", e);
        return "";
      }
    };
  }

  function createCopyButton() {
    if (document.getElementById("copyUpdateDataBtn")) return; // 重複防止

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
      try {
        const dataStr = window.generateUpdateData();
        if (!dataStr) {
          alert("コピーするデータがありません");
          return;
        }
        navigator.clipboard.writeText(dataStr)
          .then(() => alert("コピーしました！\nこの内容を generateUpdateData.js に上書きコミットしてください"))
          .catch(err => alert("コピー失敗: " + err));
      } catch (e) {
        alert("コピー時エラー: " + e);
      }
    });

    container.appendChild(btn);

    // 管理画面に配置
    const target = document.getElementById("adminUpdateLogs");
    if (target && target.parentNode) {
      target.parentNode.insertBefore(container, target);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }
  }

  // DOM 準備完了後に実行
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(createCopyButton, 200);
  });
})();