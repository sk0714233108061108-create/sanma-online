# Firebase リアルタイム対戦 - セットアップ手順

## 所要時間: 約15分（無料）

---

## STEP 1: Firebase プロジェクト作成

1. https://console.firebase.google.com にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名: `sanma-online`
4. Google アナリティクス: スキップでOK
5. 「プロジェクトを作成」→ 完了

---

## STEP 2: Realtime Database を有効化

1. 左メニュー「構築」→「Realtime Database」
2. 「データベースを作成」をクリック
3. ロケーション: `asia-southeast1`（シンガポール、日本に近い）
4. セキュリティルール: 「テストモードで開始」を選択
   （後で変更可能）
5. 「有効にする」をクリック

### セキュリティルール（テスト後にこれに変更推奨）
```json
{
  "rules": {
    "user:$uid": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "room:$roomId": {
      ".read": true,
      ".write": true
    },
    "rooms": {
      ".read": true,
      ".write": true
    }
  }
}
```

---

## STEP 3: アプリ設定を取得

1. プロジェクト概要の歯車アイコン → 「プロジェクトの設定」
2. 「マイアプリ」セクション → 「</> Web」アイコンをクリック
3. アプリのニックネーム: `sanma-web`
4. 「アプリを登録」→ firebaseConfig が表示される:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXX",
  authDomain: "sanma-online-xxxxx.firebaseapp.com",
  databaseURL: "https://sanma-online-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sanma-online-xxxxx",
  storageBucket: "sanma-online-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

## STEP 4: sanma_combined.html を修正

### `<head>` の最後に追加:

```html
<script type="module">
  import { initializeApp }
    from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
  import { getDatabase, ref, set, get, onValue, remove }
    from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

  // ↓ STEP 3 で取得した値に置き換える
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  const app = initializeApp(firebaseConfig);
  const fdb = getDatabase(app);

  // localStorage 版の DB を Firebase 版で上書き
  window.DB = {
    async get(k) {
      try {
        const snap = await get(ref(fdb, k.replace(/:/g,'_')));
        return snap.exists() ? snap.val() : null;
      } catch { return null; }
    },
    async set(k, v) {
      try { await set(ref(fdb, k.replace(/:/g,'_')), v); } catch {}
    },
    async del(k) {
      try { await remove(ref(fdb, k.replace(/:/g,'_'))); } catch {}
    },
    async list(pfx) {
      try {
        const snap = await get(ref(fdb, pfx.replace(/:/g,'_')));
        if (!snap.exists()) return [];
        return Object.keys(snap.val()).map(k => pfx + k);
      } catch { return []; }
    },
    // ★ リアルタイム監視（マルチ対戦の核心）
    listen(k, cb) {
      return onValue(ref(fdb, k.replace(/:/g,'_')),
        snap => cb(snap.exists() ? snap.val() : null));
    },
    unlisten(fn) { if(typeof fn==='function') fn(); }
  };

  window._firebaseReady = true;
  console.log('✓ Firebase connected');
</script>
```

### WaitingRoom の setInterval を listen() に変更:

```javascript
// 変更前（ポーリング）:
const iv = setInterval(async() => {
  const r = await DB.get('room:'+roomId);
  setRoom(r);
  if(r?.status==='starting') onStartGame(roomId);
}, 1000);
return () => clearInterval(iv);

// 変更後（リアルタイム）:
const unsub = DB.listen('room:'+roomId, r => {
  if(!r){ onLeave(); return; }
  setRoom(r);
  if(r.status==='starting'){ DB.unlisten(unsub); onStartGame(roomId); }
});
return () => DB.unlisten(unsub);
```

---

## STEP 5: GitHub Pages にデプロイ

```
1. GitHub リポジトリに index.html（修正済み sanma_combined.html）をアップロード
2. Settings → Pages → Deploy from branch → main
3. 5分後: https://{あなたのID}.github.io/sanma-online/
```

---

## データ構造（Firebase上）

```
/user_{id}/
  displayName: "プレイヤー名"
  hash: "sha256ハッシュ"
  stats:
    games: 42
    wins: 15
    agari: 87
    houju: 23
    ykm: { "四暗刻": 1, "大三元": 2 }

/room_{roomId}/
  id: "ABC123"
  name: "太郎の部屋"
  hostId: "taro123"
  players: [{ id, name }]
  status: "waiting" | "starting" | "playing" | "done"
  created: 1234567890

/rooms/
  ABC123: { id, name, hostId, players, status, created }
```

---

## 完成図

```
友達AのiPhone                    Firebase
 (GitHub Pages)      ←リアルタイム→  Realtime DB
                                        ↕
友達BのAndroid       ←リアルタイム→  (変更即配信)
 (GitHub Pages)
                                        ↕
あなたのPC           ←リアルタイム→  100ms以内
 (GitHub Pages)
```

