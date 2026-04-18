# study-nav

大学の履修管理・過去問進捗トラッカー。科目ごとに過去問・講義資料などのリソースを管理し、試験準備の進捗を可視化するWebアプリです。マルチユーザー対応で、ユーザーごとに独立したデータを持ちます。

---

## 機能

- **ダッシュボード** — 今学期の科目一覧と過去問の進捗をカード形式で表示。ステータス（進行中 / 未着手 / 完了）でフィルタリング可能
- **科目詳細** — 過去問・講義資料・その他リソースをカテゴリ別に管理。Google Drive の資料はアプリ内プレビューに対応
- **過去問一覧** — 全科目の過去問をまとめて確認できる横断ビュー
- **サイドバー** — ピン留めした科目へのクイックアクセス
- **認証** — Googleアカウント、またはメールアドレス＋パスワードによるログイン
- **データ分離** — RLS（行レベルセキュリティ）により、各ユーザーは自分のデータのみアクセス可能

---

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | SvelteKit 2 + Svelte 5 (Runes) + TypeScript |
| スタイリング | Tailwind CSS 4 |
| バックエンド | Supabase (PostgreSQL + RLS + Auth) |
| デプロイ | Cloudflare Pages |
| フォント | IBM Plex Sans / IBM Plex Mono / Noto Sans JP |

---

## データベース構造

```
subjects
  id, user_id (→ auth.users), name, professor, day_period,
  exam_date, term, is_archived, pinned, sort_order, created_at

resources
  id, subject_id (→ subjects), category (past_exam / lecture / other),
  name, url, done, sort_order, created_at
```

### マルチユーザーの仕組み

- `subjects.user_id` で各科目をユーザーに紐付け
- RLS ポリシーで `auth.uid() = user_id` を条件に、自分の科目のみ読み書き可能
- `resources` は親の `subject` が自分のものであるかをサブクエリで検証
- サーバーサイドでは `getSession()` ではなく `getUser()` を使用し、JWTの改ざんを防止

---

## ローカル開発

### 1. リポジトリをクローン

```sh
git clone <repository-url>
cd study-nav
pnpm install
```

### 2. Supabase プロジェクトを作成

[supabase.com](https://supabase.com) で新規プロジェクトを作成し、以下の情報を控えておきます。

- Project URL
- Publishable Key（`sb_publishable_` で始まるキー）

### 3. 環境変数を設定

`.env.local` をプロジェクトルートに作成します。

```sh
PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
```

### 4. マイグレーションを適用

Supabase Dashboard の **SQL Editor** を開き、`supabase/migrations/001_initial.sql` の内容を貼り付けて実行します。

### 5. 開発サーバーを起動

```sh
pnpm dev
```

ブラウザで `http://localhost:5173` を開き、Googleアカウントまたはメール＋パスワードでログインします。

---

## ビルド・デプロイ

```sh
pnpm build
```

Cloudflare Pages へのデプロイは `@sveltejs/adapter-cloudflare` で設定済みです。

---

## ディレクトリ構成

```
src/
  routes/
    +page                  # ダッシュボード
    subjects/[id]          # 科目詳細
    past-exams/            # 過去問一覧
    login/                 # ログイン
    auth/callback/         # 認証コールバック（OAuth・メール確認）
  lib/
    components/            # Sidebar, ProgressRing, CheckBox など
    types.ts               # 型定義・ユーティリティ関数
    supabase.ts            # クライアントサイド Supabase クライアント
  hooks.server.ts          # 認証ガード・サーバーサイド Supabase クライアント
supabase/
  migrations/              # DBマイグレーション SQL
static/
  favicon.svg              # ブランドマークのファビコン
```
