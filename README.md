# インターロック 3D

TonyTee「Interlock method」で説明されている、ボディダウン／ボディアップと7つのインターロック
（バード・スワン・バット・パンサー・ダック・シュリンプ・アリゲーター）を、Three.js の3D人体モデルで再現したページ。

- `public/moves.js` … 各ムーブのキーフレーム（拍単位）と、動画で言っているポイント
- `public/app.js` … 人体モデル（脚は2ボーンIK）・補間・UI

デプロイ: `npx wrangler pages deploy public --project-name interlock --branch main`
