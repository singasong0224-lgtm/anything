import unittest

from ledger import parse_line


class ParseLineTests(unittest.TestCase):
    def test_parse_basic_with_default_category(self):
        tx = parse_line("2024-01-15, lunch, -1200")
        self.assertEqual(tx.month, "2024-01")
        self.assertEqual(tx.description, "lunch")
        self.assertEqual(tx.amount, -1200)
        self.assertEqual(tx.category, "uncategorized")

    def test_parse_date_formats(self):
        self.assertEqual(parse_line("2024-01-15,a,1").date.isoformat(), "2024-01-15")
        self.assertEqual(parse_line("2024/01/15,a,1").date.isoformat(), "2024-01-15")
        self.assertEqual(parse_line("20240115,a,1").date.isoformat(), "2024-01-15")
        self.assertEqual(parse_line("2024-01,a,1").date.isoformat(), "2024-01-01")

    def test_parse_amount_formats(self):
        self.assertEqual(parse_line("2024-01-01,a,1234").amount, 1234)
        self.assertEqual(parse_line("2024-01-01,a,-1234").amount, -1234)
        self.assertEqual(parse_line("2024-01-01,a,1,234,b").amount, 1234)
        self.assertEqual(parse_line("2024-01-01,a,¥1,234,b").amount, 1234)
        self.assertEqual(parse_line("2024-01-01,a,￥1,234,b").amount, 1234)
        self.assertEqual(parse_line("2024-01-01,a,1,234円,b").amount, 1234)
        self.assertEqual(parse_line("2024-01-01,a,(1,234),b").amount, -1234)
        self.assertEqual(parse_line("2024-01-01,a,+123,b").amount, 123)

    def test_blank_category_is_defaulted(self):
        tx = parse_line("2024-01-01, a, 100,   ")
        self.assertEqual(tx.category, "uncategorized")

    def test_invalid_lines(self):
        with self.assertRaises(ValueError):
            parse_line("2024-01-01, only-two")
        with self.assertRaises(ValueError):
            parse_line("2024-01-01, a, 100, x, y")
        with self.assertRaises(ValueError):
            parse_line("bad-date, a, 100")
        with self.assertRaises(ValueError):
            parse_line("2024-01-01, a, ")
        with self.assertRaises(ValueError):
            parse_line("2024-01-01, , 100")


if __name__ == "__main__":
    unittest.main()
