# インターロック 3D

TonyTee「Interlock method」で説明されている、ボディダウン／ボディアップと7つのインターロック
（バード・スワン・バット・パンサー・ダック・シュリンプ・アリゲーター）を、Three.js の3D人体モデルで再現したページ。

- `public/moves.js` … 各ムーブのキーフレーム（拍単位）と、動画で言っているポイント
- `public/model.js` … オリジナルのちびキャラ（脚は2ボーンIK）とポーズ補間
- `public/app.js` … 解説モード／曲で練習モードのUI
- `public/presets.js` … 解析済みの拍・セクション位置（音源そのものは含まない。読み込んだファイルの長さで照合）

「曲で練習」では手元の音源ファイルをブラウザ内だけで再生する（サーバーにアップロードしない）。

デプロイ: `npx wrangler pages deploy public --project-name interlock --branch main`
