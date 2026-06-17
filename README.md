# ZeroDrop

落ちもの対戦パズルゲーム（独自オリジナル）。外部ライブラリ不使用・Canvas 2D + Vanilla JS で、
すべてを単一の `index.html` にインライン収録した**静的サイト**です。WordPress 埋め込みや
GitHub Pages 公開を想定しています。

> 現在の実装範囲: **Phase 2（対CPU対戦・2盤面・おじゃまブロック）**
> ＝ Phase 1 のコアエンジンに、CPU AI（EASY/NORMAL/HARD）と連鎖でのおじゃま送り合いを追加。

## ローカルで動かす

`index.html` をブラウザで直接開くだけで動作します（ビルド不要・サーバー不要）。

```bash
# 任意: 簡易サーバーで開く場合
python3 -m http.server 8000
# → http://localhost:8000/index.html
```

## GitHub Pages で公開する手順

このリポジトリは静的サイトとしてそのまま公開できます。`index.html` がリポジトリの
**ルート**にあり、CSS/JS/アセットはすべてインライン（外部参照ゼロ）なので、サブパス公開でも
リンクが壊れません。Jekyll 処理を無効化する `.nojekyll` も同梱済みです。

1. 公開したい内容（`index.html` / `.nojekyll`）を **`main` ブランチのルート**に置く
   （このゲームは作業ブランチで開発中のため、公開時は `main` へマージしてください）。
2. GitHub リポジトリの **Settings → Pages** を開く。
3. **Build and deployment → Source** を **「Deploy from a branch」** にする。
4. **Branch** を **`main`**、フォルダを **`/ (root)`** に設定して **Save**。
5. 数十秒〜数分待つと公開されます。

### スマホでのテストURL

公開後、以下のURLにスマホのブラウザでアクセスするとそのままプレイできます。

```text
https://singasong0224-lgtm.github.io/anything/
```

> 反映には少し時間がかかります。表示が更新されない場合は、ブラウザのキャッシュ削除や
> URL 末尾に `?v=2` のようなクエリを付けてアクセスしてください。

---

# Ledger CLI

標準ライブラリのみで動く、家計簿のCSV風テキストを月次集計する最小CLIです。

## ファイル構成

```text
ledger/
  __init__.py
  __main__.py
  cli.py
  parser.py
tests/
  test_cli.py
  test_parser.py
```

## 使い方

```bash
python -m ledger < input.txt
```

### 入力形式

1行ごとに以下の形式です（前後スペース可）。

```text
DATE, DESCRIPTION, AMOUNT, CATEGORY(optional)
```

- DATE: `YYYY-MM-DD` / `YYYY/MM/DD` / `YYYYMMDD` / `YYYY-MM`（月指定は1日扱い）
- AMOUNT: `1234` `-1234` `1,234` `¥1,234` `￥1,234` `1,234円` `(1,234)` `+123`
- CATEGORY: 省略または空白のみなら `uncategorized`

### 入力例

```text
2024-01-10, Salary, 300000, income
2024-01-11, Rent, -100000, housing
2024-02, Bonus, +50000, income
2024-02-03, Coffee, (500), food
```

### 出力例

```text
month,income,expense,net,count
2024-01,300000,100000,200000,2
2024-02,50000,500,49500,2
```

不正行がある場合は、処理可能な行を集計した上で `stderr` にエラーを表示し、終了コード `1` を返します。
