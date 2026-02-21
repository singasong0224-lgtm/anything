from __future__ import annotations

import sys
from collections import defaultdict

from .parser import parse_line


def main() -> int:
    monthly = defaultdict(lambda: {"income": 0, "expense": 0, "net": 0, "count": 0})
    errors = []

    for lineno, raw in enumerate(sys.stdin, start=1):
        line = raw.strip()
        if not line:
            continue
        try:
            tx = parse_line(line)
        except ValueError as exc:
            errors.append(f"line {lineno}: {exc}")
            continue

        m = monthly[tx.month]
        if tx.amount >= 0:
            m["income"] += tx.amount
        else:
            m["expense"] += abs(tx.amount)
        m["net"] += tx.amount
        m["count"] += 1

    if not monthly:
        print("No valid transactions.")
    else:
        print("month,income,expense,net,count")
        for month in sorted(monthly):
            m = monthly[month]
            print(f"{month},{m['income']},{m['expense']},{m['net']},{m['count']}")

    if errors:
        print("\nErrors:", file=sys.stderr)
        for msg in errors:
            print(msg, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
