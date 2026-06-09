# 三麻 ONLINE - デプロイ手順書

## 必要なもの
- GitHubアカウント（無料）
- 1つのファイル: `sanma_combined.html`

---

## ① GitHub Pages（最速・無料）

### 手順

1. **GitHubにログイン** → https://github.com

2. **新しいリポジトリを作成**
   - 右上「+」→「New repository」
   - Repository name: `sanma-online`
   - **Public**を選択
   - 「Create repository」をクリック

3. **ファイルをアップロード**
   - 「Add file」→「Upload files」
   - `sanma_combined.html`をドラッグ＆ドロップ
   - ファイル名を **`index.html`** に変更
     (または Upload 後に Rename)
   - 「Commit changes」

4. **GitHub Pages を有効化**
   - リポジトリの「Settings」タブ
   - 左メニュー「Pages」
   - Source: **Deploy from a branch**
   - Branch: **main** / **(root)**
   - 「Save」

5. **完了！ 5〜10分後にアクセス可能**
   ```
   https://{あなたのID}.github.io/sanma-online/
   ```

---

## ② Netlify（ドラッグ&ドロップ・1分）

1. https://app.netlify.com/drop にアクセス
2. `sanma_combined.html` をドラッグ＆ドロップ
3. 即座にURLが発行される（例: wonderful-game-123456.netlify.app）

---

## ③ Firebase Hosting（本格運用向け）

```bash
# 前提: Node.js インストール済み
npm install -g firebase-tools
firebase login
firebase init hosting
# public directory: .
# single-page app: Yes
cp sanma_combined.html public/index.html
firebase deploy
```

---

## 注意事項

### localStorage について
- データはブラウザ内に保存されます
- 同じデバイス・同じブラウザでのみ共有可能
- 異なるユーザーとの対戦記録は共有されません

### マルチデバイス対応へのアップグレード
データをクラウドで共有するには、Firebase Firestoreへの移行が必要です。
以下のコードの `DB` オブジェクトを Firebase SDK の書き込み/読み込みに置き換えます。

```javascript
// 現在（localStorage版）
const DB = {
  async get(k) { return JSON.parse(localStorage.getItem('sanma_'+k)); }
  // ...
};

// Firebase版に置き換え
import { doc, getDoc, setDoc } from "firebase/firestore";
const DB = {
  async get(k) { 
    const snap = await getDoc(doc(db, 'sanma', k));
    return snap.exists() ? snap.data() : null;
  }
  // ...
};
```

---

## ファイル構成

```
index.html          ← sanma_combined.html をリネーム
                       (116KB, ビルド不要)
```

それだけです！

