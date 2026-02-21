from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
import re


@dataclass(frozen=True)
class Transaction:
    date: date
    description: str
    amount: int
    category: str = "uncategorized"

    @property
    def month(self) -> str:
        return self.date.strftime("%Y-%m")


_DATE_FORMATS = ("%Y-%m-%d", "%Y/%m/%d", "%Y%m%d", "%Y-%m")


def _parse_date(raw: str) -> date:
    text = raw.strip()
    for fmt in _DATE_FORMATS:
        try:
            d = datetime.strptime(text, fmt).date()
            if fmt == "%Y-%m":
                return d.replace(day=1)
            return d
        except ValueError:
            continue
    raise ValueError(f"invalid date: {raw!r}")


def _parse_amount(raw: str) -> int:
    text = raw.strip()
    if not text:
        raise ValueError("amount is empty")

    neg_by_parens = text.startswith("(") and text.endswith(")")
    if neg_by_parens:
        text = text[1:-1].strip()

    text = text.replace("¥", "").replace("￥", "").replace("円", "").strip()

    sign = 1
    if text.startswith("+"):
        text = text[1:].strip()
    elif text.startswith("-"):
        sign = -1
        text = text[1:].strip()

    if not text:
        raise ValueError("amount is empty")

    if not re.fullmatch(r"\d{1,3}(,\d{3})*|\d+", text):
        raise ValueError(f"invalid amount: {raw!r}")

    value = int(text.replace(",", "")) * sign
    if neg_by_parens:
        value = -abs(value)
    return value


def parse_line(line: str) -> Transaction:
    parts = [p.strip() for p in line.strip().split(",")]
    if len(parts) < 3:
        raise ValueError("line must have at least 3 comma-separated fields")

    raw_date, description = parts[0], parts[1]
    rest = parts[2:]

    if not description:
        raise ValueError("description is empty")

    raw_amount = ",".join(rest)
    category = "uncategorized"

    try:
        amount = _parse_amount(raw_amount)
    except ValueError:
        if len(rest) < 2:
            raise
        category = rest[-1]
        raw_amount = ",".join(rest[:-1])
        amount = _parse_amount(raw_amount)

    if not category.strip():
        category = "uncategorized"

    return Transaction(
        date=_parse_date(raw_date),
        description=description,
        amount=amount,
        category=category.strip(),
    )
