# 三麻 ONLINE - プロジェクト引き継ぎ書

## プロジェクト概要
CRTフォスファーグリーン美学の三人打ち麻雀（三麻）ブラウザゲーム＋マルチプレイヤープラットフォーム。
単一HTMLファイルとして動作。サーバー不要。

---

## ファイル構成

| ファイル | 内容 | サイズ |
|---|---|---|
| `sanma_mahjong.html` | ゲーム本体（完成済み） | 93KB / 1835行 |
| `sanma_platform.jsx` | Reactプラットフォーム層 | 37KB |
| `sanma_combined.html` | 統合済みデプロイ用ファイル | 116KB |
| `FIREBASE_SETUP.md` | Firebase連携手順書 | - |
| `DEPLOY_README.md` | GitHub Pagesデプロイ手順 | - |

---

## 技術スタック

- **ゲーム**: Vanilla JS + Web Audio API + SVGタイルグラフィック
- **プラットフォーム**: React 18 (Babel CDN, ビルド不要)
- **データ**: localStorage（デプロイ版）/ window.storage（Claude artifact版）
- **マルチプレイヤー**: Firebase Realtime Database（未実装、FIREBASE_SETUP.md参照）
- **デプロイ**: GitHub Pages / Netlify（静的ファイル）

---

## ゲームの仕様

### 基本ルール
- 三人打ち麻雀（三麻）
- 牌構成: 萬子1・9のみ、筒子1〜9、索子1〜9、字牌7種
- 初期点数: 各25,000点
- 東風戦（3局）/ 半荘（6局）選択可
- 焼鳥ルール: 1度も和了なし → 終了時8,000点払い

### 実装済み機能
- 完全な役判定（31役）＋役満11種
- 副露（ポン・暗カン・加カン・大明カン）
- リーチ・ダブルリーチ・一発・裏ドラ・カン裏
- リーチ後暗カン（待ち変化なしチェック付き）
- 符計算（雀頭符・待ち型符含む）
- フリテン（一時・永続・リーチ後）
- 連荘（親勝利時は続行）
- 流局（親テンパイ時は続行）
- CRT効果音（Web Audio API）
- 掛け声（Web Speech API）
- サイコロ演出（親決め）

### 既知の制限（未実装）
- チー（副露）なし（三麻ルールにより不要）
- 副露後のフリテン判定（副露時はフリテン無効の場合あり）
- リーチ後暗カンをCPUが行う場合の待ち変化チェック精度

---

## プラットフォーム仕様

### 認証
- ID（英数字3〜16文字）＋パスワード（SHA-256ハッシュ）
- localStorage にセッション保存
- DB.get/set は async（Firebase移行時はそのまま使える設計）

### 統計データ構造
```javascript
stats: {
  games: number,     // 対局数
  wins: number,      // 勝利数
  agari: number,     // 和了回数
  houju: number,     // 放銃回数
  ykm: {             // 役満記録
    "四暗刻": 2,
    "大三元": 1,
  }
}
```

### マルチプレイヤー（ポーリング実装済み、Firebase移行待ち）
- ルーム作成（6文字コード）
- 2〜3人 + CPUで対局開始
- localStorage版は1デバイス内のみ有効
- Firebase移行でクロスデバイス対戦可能に

---

## 次にやること（優先度順）

### 高優先度
1. **Firebase統合** - `FIREBASE_SETUP.md` の手順に従う
   - `DB` オブジェクトをFirebase版に置き換え（約30行）
   - WaitingRoom の setInterval → `DB.listen()` に変更
   - セキュリティルール設定

2. **GitHub Pagesデプロイ** - `DEPLOY_README.md` の手順に従う
   - `sanma_combined.html` を `index.html` にリネームしてアップロード

### 中優先度
3. **ゲーム→プラットフォーム間のデータ連携強化**
   - `window._sanmaGameCallback` の自動呼び出し実装
   - 現在は ManualResultEntry（手動入力）で代替中

4. **マルチプレイヤーのゲーム状態同期**
   - Firebase Realtime Database でゲーム状態を共有
   - ホストがゲームを進行、他プレイヤーがポーリング

### 低優先度
5. PWA対応（manifest.json, service worker）
6. プロフィール画像
7. 対局履歴詳細

---

## 主要な変数・関数

### ゲーム状態 (G)
```javascript
G = {
  phase, round, honba, kyotaku, dealer,
  roundWind, gameMode, wall[], dora[], uDoraPool[],
  players: [{
    id, name, score, hand[], drawn, discards[], melds[],
    riichi, ippatsu, doubleRiichi, furiten, riichiMissedWin,
    wind, wonOnce, rinshan
  }],
  cur, selIdx, anyDiscardMade, isLastTile,
  lastWinner, dealerTenpai
}
```

### 重要な修正済みバグ
- `getDecomp`: 副露タイルの二重登録バグ修正（役牌4翻バグの原因）
- `countDora`: 副露タイルの二重カウントバグ修正
- `四暗刻`: シャンポン待ちロンは不成立（手牌内ロン牌数チェック）
- `連荘`: 親が上がった場合の局進行修正
- `closeWin`: 流局後の dealer 二重ローテーションバグ修正

---

## このチャットの引き継ぎ元
Claude.ai での長期開発セッション。
主要な開発判断・バグ修正の詳細は会話履歴に記録されている。

