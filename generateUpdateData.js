/* ============================
   generateUpdateData.js — 管理者用コピー補助（安定版・修正版）
   - script.js の下に読み込む
   - 管理者画面にコピー用ボタンを表示
   ============================ */

(function() {
  function createCopyButton() {
    // すでにある場合はスキップ
    if (document.getElementById("copyUpdateDataBtn")) return;
    // generateUpdateData がまだ未定義なら作らない
    if (typeof generateUpdateData !== "function") return;

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
        const dataStr = generateUpdateData(); // 文字列生成
        navigator.clipboard.writeText(dataStr)
          .then(() => alert("コピーしました！\nこの内容を generateUpdateData.js に上書きコミットしてください"))
          .catch(err => alert("コピー失敗: " + err));
      } catch (e) {
        alert("generateUpdateData 関数が存在しません");
      }
    });

    container.appendChild(btn);

    // #adminUpdateLogs の前に追加、なければ body の先頭に追加
    const target = document.getElementById("adminUpdateLogs");
    if (target && target.parentNode) {
      target.parentNode.insertBefore(container, target);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }
  }

  // DOM読み込み後にボタンを追加
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createCopyButton);
  } else {
    createCopyButton();
  }
})();