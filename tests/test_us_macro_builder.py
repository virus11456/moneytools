import csv
import importlib.util
import io
import unittest
import zipfile
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "build_us_macro.py"
SPEC = importlib.util.spec_from_file_location("build_us_macro", SCRIPT)
macro = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(macro)


class UsMacroBuilderTests(unittest.TestCase):
    def test_ratio_uses_only_same_day_observations(self):
        numerator = [("2026-01-01", 20.0), ("2026-01-02", 30.0)]
        denominator = [("2026-01-01", 10.0), ("2026-01-03", 5.0)]
        self.assertEqual(macro.ratio_points(numerator, denominator), [
            {"date": "2026-01-01", "value": 2.0},
        ])

    def test_cftc_uses_disclosed_consolidated_contract_and_formula(self):
        fields = [
            "Report_Date_as_YYYY-MM-DD", "CFTC_Contract_Market_Code",
            "Lev_Money_Positions_Long_All", "Lev_Money_Positions_Short_All",
        ]
        text = io.StringIO()
        writer = csv.DictWriter(text, fieldnames=fields)
        writer.writeheader()
        writer.writerow({
            "Report_Date_as_YYYY-MM-DD": "9/22/2026 12:00:00 AM",
            "CFTC_Contract_Market_Code": "13874+",
            "Lev_Money_Positions_Long_All": "120000",
            "Lev_Money_Positions_Short_All": "145000",
        })
        writer.writerow({
            "Report_Date_as_YYYY-MM-DD": "2026-09-22",
            "CFTC_Contract_Market_Code": "20974+",
            "Lev_Money_Positions_Long_All": "50000",
            "Lev_Money_Positions_Short_All": "30000",
        })
        payload = io.BytesIO()
        with zipfile.ZipFile(payload, "w") as archive:
            archive.writestr("FinFutYY.txt", text.getvalue())
        parsed = macro.parse_cftc_zip(payload.getvalue())
        self.assertEqual(parsed["SP500_COT"]["2026-09-22"], -25000)
        self.assertEqual(parsed["NASDAQ_COT"]["2026-09-22"], 20000)

    def test_twenty_period_average_starts_only_after_twenty_points(self):
        points = [{"date": f"2026-01-{day:02d}", "value": float(day)} for day in range(1, 22)]
        averaged = macro.moving_average(points, 20)
        self.assertEqual(len(averaged), 2)
        self.assertEqual(averaged[0], {"date": "2026-01-20", "value": 10.5})


if __name__ == "__main__":
    unittest.main()
