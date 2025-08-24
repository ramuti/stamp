/* ============================
   generateUpdateData.js — 管理者用コピー補助（安定版）
   - script.js の下に読み込む
   - 管理者画面にコピー用ボタンを表示
============================ */

(function() {
  // 仮に generateUpdateData 関数がまだなければ定義
  if (typeof generateUpdateData !== "function") {
    window.generateUpdateData = function() {
      // ローカルストレージからカード・合言葉を取得して文字列化
      const cards = localStorage.getItem("cards") || "[]";
      const keywords = localStorage.getItem("keywords") || "[]";
      return `/* カード */\n${cards}\n/* キーワード */\n${keywords}`;
    };
  }

  function createCopyButton() {
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
      try {
        const dataStr = generateUpdateData();
        navigator.clipboard.writeText(dataStr)
          .then(() => alert("コピーしました！\nこの内容を generateUpdateData.js に上書きコミットしてください"))
          .catch(err => alert("コピー失敗: " + err));
      } catch (e) {
        alert("generateUpdateData 関数が正しく動作していません: " + e);
      }
    });

    container.appendChild(btn);

    const target = document.getElementById("adminUpdateLogs");
    if (target && target.parentNode) {
      target.parentNode.insertBefore(container, target);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }
  }

  document.addEventListener("DOMContentLoaded", () => setTimeout(createCopyButton, 100));
})();