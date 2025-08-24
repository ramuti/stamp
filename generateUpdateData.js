/* ============================
   generateUpdateData.js — 管理者用コピー補助（完全版）
   - script.js の下に読み込む
   - 他の機能に干渉しない
============================ */

(function() {
  // generateUpdateData 関数が未定義なら定義
  if (typeof window.generateUpdateData !== "function") {
    window.generateUpdateData = function() {
      try {
        const cards = localStorage.getItem("cards") || "[]";
        const keywords = localStorage.getItem("keywords") || "[]";
        return `/* カード */\n${cards}\n/* キーワード */\n${keywords}`;
      } catch (e) {
        return "データ取得失敗: " + e;
      }
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
        const dataStr = window.generateUpdateData();
        navigator.clipboard.writeText(dataStr)
          .then(() => alert("コピーしました！\nこの内容を generateUpdateData.js に上書きコミットしてください"))
          .catch(err => alert("コピー失敗: " + err));
      } catch (e) {
        alert("コピー処理でエラー: " + e);
      }
    });

    container.appendChild(btn);

    // 管理者エリアにだけ出す
    const target = document.getElementById("adminUpdateLogs");
    if (target && target.parentNode) {
      target.parentNode.insertBefore(container, target);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }
  }

  // script.js とバッティングしないように安全に追加
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(createCopyButton, 200);
  });
})();