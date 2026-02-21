import io
import unittest
from unittest.mock import patch

from ledger.cli import main


class CLITests(unittest.TestCase):
    def test_monthly_aggregation(self):
        data = "\n".join(
            [
                "2024-01-10, Salary, 300000, income",
                "2024-01-11, Rent, -100000, housing",
                "2024-02, Bonus, +50000, income",
                "2024-02-03, Coffee, (500), food",
            ]
        )

        stdout = io.StringIO()
        stderr = io.StringIO()
        with patch("sys.stdin", io.StringIO(data)), patch("sys.stdout", stdout), patch("sys.stderr", stderr):
            rc = main()

        self.assertEqual(rc, 0)
        self.assertEqual(stderr.getvalue(), "")
        out = stdout.getvalue().strip().splitlines()
        self.assertEqual(out[0], "month,income,expense,net,count")
        self.assertEqual(out[1], "2024-01,300000,100000,200000,2")
        self.assertEqual(out[2], "2024-02,50000,500,49500,2")

    def test_reports_errors_and_nonzero_exit(self):
        data = "\n".join(["bad line", "2024-01-01,ok,100"])
        stdout = io.StringIO()
        stderr = io.StringIO()
        with patch("sys.stdin", io.StringIO(data)), patch("sys.stdout", stdout), patch("sys.stderr", stderr):
            rc = main()

        self.assertEqual(rc, 1)
        self.assertIn("2024-01,100,0,100,1", stdout.getvalue())
        self.assertIn("Errors:", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
