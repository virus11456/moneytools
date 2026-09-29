import csv
import importlib.util
import io
import unittest
import zipfile
from datetime import datetime, timedelta
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

    def test_moving_average_restarts_after_a_long_gap_and_keeps_weekends(self):
        start = datetime(2024, 1, 3)
        points = [
            {"date": (start + timedelta(days=7 * index)).strftime("%Y-%m-%d"), "value": float(index + 1)}
            for index in range(20)
        ]
        resumed = start + timedelta(days=7 * 19 + 21)
        points.extend(
            {"date": (resumed + timedelta(days=7 * index)).strftime("%Y-%m-%d"), "value": 100.0 + index}
            for index in range(5)
        )
        averaged = macro.moving_average(points, 20)
        self.assertEqual(averaged, [{"date": points[19]["date"], "value": 10.5}])
        self.assertEqual(macro.long_gap_breaks(points), [points[20]["date"]])
        self.assertEqual(
            [point["date"] for point in macro.normalize_points(points)],
            [point["date"] for point in points],
        )

        business = []
        day = datetime(2024, 1, 1)
        while len(business) < 30:
            if day.weekday() < 5:
                business.append({"date": day.strftime("%Y-%m-%d"), "value": float(len(business) + 1)})
            day += timedelta(days=1)
        self.assertEqual(len(macro.moving_average(business, 20)), 11)
        self.assertEqual(macro.long_gap_breaks(business), [])


class ObservationParserTests(unittest.TestCase):
    def test_normal_rows_keep_numbers_and_sort_dates(self):
        parsed = macro.normalize_points([
            ("2024-03-01", 2),
            {"date": "2024-01-05", "value": "1,234.50"},
        ])
        self.assertEqual(parsed, [
            {"date": "2024-01-05", "value": 1234.5},
            {"date": "2024-03-01", "value": 2.0},
        ])

    def test_empty_and_changed_format_publish_nothing(self):
        self.assertEqual(macro.normalize_points([]), [])
        self.assertEqual(macro.normalize_points(None), [])
        self.assertEqual(macro.normalize_points([{"period": "2024-01", "reading": "high"}]), [])
        self.assertEqual(macro.normalize_points([{"date": "2024-01-01", "value": "n/a"}]), [])
        self.assertEqual(macro.normalize_points([{"date": "2024-01-01", "value": float("nan")}]), [])
        self.assertEqual(macro.normalize_points([{"date": "2024-01-01", "value": float("inf")}]), [])

    def test_duplicate_dates_keep_the_later_row_without_filling_gaps(self):
        parsed = macro.normalize_points([
            {"date": "2020-01-01", "value": 1},
            {"date": "2020-01-01", "value": 4},
            {"date": "2020-06-01", "value": 9},
            {"date": "2019-12-01", "value": 3},
        ])
        self.assertEqual(parsed, [
            {"date": "2019-12-01", "value": 3.0},
            {"date": "2020-01-01", "value": 4.0},
            {"date": "2020-06-01", "value": 9.0},
        ])


class LicensedSeriesTests(unittest.TestCase):
    def test_each_new_source_stays_missing_for_every_parser_fixture(self):
        fixtures = {
            "normal": [{"date": "2024-01-05", "value": 54.6}, {"date": "2024-02-02", "value": 55.1}],
            "empty": [],
            "format_change": [{"period": "2024-W01", "reading": "up"}],
            "duplicates": [{"date": "2024-01-05", "value": 1}, {"date": "2024-01-05", "value": 2}],
            "long_gap": [{"date": "2020-01-01", "value": 40}, {"date": "2024-01-01", "value": 90}],
        }
        self.assertEqual(set(macro.LICENSED_SERIES), {
            "REDBOOK", "ISM_PMI", "ISM_NEWORDERS", "ISM_SERVICES", "NAAIM", "NAAIM_MA20",
        })
        for series_id in macro.LICENSED_SERIES:
            for name, rows in fixtures.items():
                with self.subTest(series_id=series_id, fixture=name):
                    released = macro.release_observation_series(series_id, rows)
                    self.assertEqual(released["points"], [])
                    self.assertIsNone(released["latestDate"])
                    self.assertEqual(released["status"], "missing")
                    self.assertIs(released["substitute"], False)
                    self.assertTrue(released["reason"])
                    self.assertNotIn(0, [point.get("value") for point in released["points"]])

    def test_naaim_average_is_computed_only_from_raw_points_and_is_not_published(self):
        raw = [{"date": (datetime(2024, 1, 3) + timedelta(days=7 * index)).strftime("%Y-%m-%d"), "value": float(index + 1)} for index in range(25)]
        averaged = macro.moving_average(raw, 20)
        self.assertEqual(len(averaged), 6)
        self.assertEqual(averaged[0]["date"], raw[19]["date"])
        self.assertEqual(averaged[0]["value"], 10.5)
        released = macro.release_observation_series("NAAIM_MA20", averaged)
        self.assertEqual(released["points"], [])
        self.assertIn("不計算", released["reason"])


class PublishedMergeTests(unittest.TestCase):
    def test_failed_refresh_keeps_old_dates_and_does_not_zero_or_restamp(self):
        old = {"points": [{"date": "2019-05-03", "value": 1.25}]}
        failed = {"points": [{"date": "2026-09-29", "value": 0}], "error": "RuntimeError: timeout"}
        merged = macro.merge_one(failed, old)
        self.assertEqual(merged["latestDate"], "2019-05-03")
        self.assertEqual(merged["points"], [{"date": "2019-05-03", "value": 1.25}])
        self.assertTrue(merged["preserved"])
        self.assertNotIn("2026-09-29", [point["date"] for point in merged["points"]])

        empty = macro.merge_one({"points": []}, old)
        self.assertEqual(empty["points"], [{"date": "2019-05-03", "value": 1.25}])

    def test_incremental_update_revises_overlapping_dates_and_keeps_history(self):
        merged = macro.merge_one(
            {"points": [{"date": "2019-05-03", "value": 1.5}, {"date": "2019-06-07", "value": 2}]},
            {"points": [{"date": "2019-05-03", "value": 1.25}, {"date": "2019-04-05", "value": 1}]},
        )
        self.assertEqual(merged["points"], [
            {"date": "2019-04-05", "value": 1.0},
            {"date": "2019-05-03", "value": 1.5},
            {"date": "2019-06-07", "value": 2.0},
        ])
        self.assertEqual(merged["latestDate"], "2019-06-07")
        self.assertNotIn("preserved", merged)

    def test_merge_drops_blocked_series_even_if_a_baseline_contains_them(self):
        baseline = {
            "REDBOOK": {"points": [{"date": "2024-01-06", "value": 3.2}]},
            "NAAIM": {"points": [{"date": "2024-01-03", "value": 80}]},
            "ICSA": {"points": [{"date": "2024-01-06", "value": 210}]},
        }
        merged = macro.merge_published({"ICSA": {"points": [], "error": "down"}}, baseline)
        self.assertEqual(merged["REDBOOK"]["points"], [])
        self.assertEqual(merged["NAAIM"]["status"], "missing")
        self.assertEqual(merged["NAAIM_MA20"]["points"], [])
        self.assertEqual(merged["ISM_PMI"]["substitute"], False)
        self.assertEqual(merged["ICSA"]["points"], [{"date": "2024-01-06", "value": 210.0}])
        self.assertTrue(merged["ICSA"]["preserved"])


if __name__ == "__main__":
    unittest.main()
