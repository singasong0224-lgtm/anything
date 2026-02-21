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
