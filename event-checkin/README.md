# イベント受付チェックインシステム

Googleスプレッドシートをデータソースにした、受付スタッフ向けの検索・チェックインWebアプリです。  
フロントエンドは React + TypeScript (Vite)、バックエンドは Node.js + Express + TypeScript で構成されています。

## 主な機能

- パスワードログイン（セッション認証）
- 氏名/ふりがなファジー検索（`fuse.js` + `wanakana`）
- チェックイン処理（スプレッドシート J/K 列更新）
- チェックイン済み件数表示
- 30秒キャッシュ + チェックイン後キャッシュクリア

## 1. Google Cloud Console の設定

1. 新しいプロジェクトを作成
2. **Google Sheets API** を有効化
3. **サービスアカウント**を作成し、JSONキーをダウンロード
4. ダウンロードした JSON を `server/credentials.json` として配置

## 2. Googleスプレッドシートの設定

1. 新しいスプレッドシートを作成
2. 1行目にヘッダーを以下順で入力

   - A列: 顧客番号
   - B列: 氏名
   - C列: ふりがな
   - D列: メールアドレス
   - E列: 電話番号
   - F列: 店舗
   - G列: 担当者
   - H列: 同伴者の人数
   - I列: お酒が飲めるか（`○` / `×`）
   - J列: チェックイン済み（空白 or `済`）
   - K列: チェックイン時刻（ISO8601）

3. サービスアカウントメールをスプレッドシートに「編集者」で共有
4. スプレッドシートID（URLの `/d/` と `/edit` の間）を `GOOGLE_SPREADSHEET_ID` に設定

## 3. 環境変数の設定

```bash
cd server
cp .env.example .env
```

`server/.env` を編集し、値を設定してください。

```env
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials.json
PORT=3001
SESSION_SECRET=your_random_secret_here
RECEPTION_PASSWORD=your_password_here
CORS_ORIGIN=http://localhost:5173
APP_BASE_PATH=
```

`APP_BASE_PATH` はサブパス配信時のみ指定します。  
例: `https://event.goto-webmake.com/event-checkin` で公開する場合は `APP_BASE_PATH=/event-checkin`

`CORS_ORIGIN` はフロントを配信するURLを指定してください。  
例: `https://event.goto-webmake.com`

## 4. インストールとビルド

```bash
cd server && npm install
cd ../client && npm install && npm run build
```

## 5. 起動

```bash
cd ../server
npm run build
npm start
```

ブラウザで [http://localhost:3001](http://localhost:3001) にアクセスしてください。  
（本番想定では `client/dist` を `server` が静的配信します）

### サブパス配信（例: `/event-checkin`）する場合

- `server/.env` に `APP_BASE_PATH=/event-checkin` を設定
- `client/.env.production` の `VITE_BASE_PATH=/event-checkin` を維持して `npm run build`
- 公開URLは `https://event.goto-webmake.com/event-checkin`

### APIを別サーバー（Renderなど）で動かす場合

1. `server` を Render の Web Service としてデプロイ
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
2. Render 側の環境変数に `server/.env` と同じ値を設定
   - `CORS_ORIGIN=https://event.goto-webmake.com`
   - `APP_BASE_PATH=`（空でOK）
3. `credentials.json` は Render の Secret File 機能で配置し、`GOOGLE_SERVICE_ACCOUNT_KEY_PATH` をそのパスに合わせる
4. `client/.env.production` の `VITE_API_ORIGIN` を Render のURLに変更
   - 例: `https://event-checkin-api.onrender.com`
5. `client` を再ビルドして `dist` を本番公開先へ再アップロード

## 開発時の起動（任意）

別ターミナルで以下を実行します。

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

## 動作確認用サンプルデータ（手動入力）

スプレッドシートの2行目以降に以下を入力すると動作確認できます（5件）。

| 顧客番号 | 氏名 | ふりがな | メールアドレス | 電話番号 | 店舗 | 担当者 | 同伴者の人数 | お酒が飲めるか | チェックイン済み | チェックイン時刻 |
|---|---|---|---|---|---|---|---:|---|---|---|
| CUST-0001 | 青山 凛 | あおやま りん | rin.aoyama@example.com | 090-1111-1111 | 銀座本店 | 松本 | 2 | ○ |  |  |
| CUST-0002 | 佐藤 美月 | さとう みづき | mizuki.sato@example.com | 090-2222-2222 | 新宿店 | 高橋 | 0 | × |  |  |
| CUST-0003 | John Smith | じょん すみす | john.smith@example.com | 090-3333-3333 | 渋谷店 | 伊藤 | 1 | ○ |  |  |
| CUST-0004 | 鈴木 一真 | すずき かずま | kazuma.suzuki@example.com | 090-4444-4444 | 横浜店 | 田中 | 3 | × |  |  |
| CUST-0005 | Emma Brown | えま ぶらうん | emma.brown@example.com | 090-5555-5555 | 池袋店 | 小林 | 0 | ○ |  |  |

## API 概要

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/status`
- `GET /api/search?q=...`（認証必須）
- `GET /api/search/stats`（認証必須）
- `POST /api/checkin`（認証必須）
