#!/usr/bin/env python
"""Populate a wintest workspace with realistic demo data for presentations.

Creates tests, suites, pipelines, and a backlog of historical reports so the UI
looks lived-in. Some tests use `notepad.exe` and are actually runnable.

Usage:
    python scripts/generate_demo_data.py --workspace C:/path/to/workspace
    python scripts/generate_demo_data.py --workspace ./demo_ws --clear
"""

import argparse
import json
import random
import shutil
from datetime import datetime, timedelta
from pathlib import Path

import yaml


# ------------------------------------------------------------------ Tests ----

RUNNABLE_TESTS = [
    {
        "filename": "notepad_basic_text_entry.yaml",
        "name": "Notepad - Basic Text Entry",
        "tags": ["smoke", "notepad"],
        "variables": {"message": "Hello from wintest!"},
        "steps": [
            {"action": "launch_application", "app_path": "notepad.exe", "wait_seconds": 2.0,
             "description": "Launch Notepad"},
            {"action": "type", "text": "{{message}}", "description": "Type test message"},
            {"action": "wait", "wait_seconds": 1.0},
            {"action": "hotkey", "keys": ["ctrl", "a"], "description": "Select all"},
            {"action": "wait", "wait_seconds": 0.5},
            {"action": "press_key", "key": "delete", "description": "Clear text"},
        ],
    },
    {
        "filename": "notepad_multiline_entry.yaml",
        "name": "Notepad - Multiline Entry",
        "tags": ["notepad"],
        "steps": [
            {"action": "launch_application", "app_path": "notepad.exe", "wait_seconds": 2.0},
            {"action": "type", "text": "Line 1"},
            {"action": "press_key", "key": "enter"},
            {"action": "type", "text": "Line 2"},
            {"action": "press_key", "key": "enter"},
            {"action": "type", "text": "Line 3"},
            {"action": "wait", "wait_seconds": 1.0},
            {"action": "hotkey", "keys": ["ctrl", "a"]},
            {"action": "press_key", "key": "delete"},
        ],
    },
    {
        "filename": "notepad_undo_redo.yaml",
        "name": "Notepad - Undo and Redo",
        "tags": ["notepad", "regression"],
        "steps": [
            {"action": "launch_application", "app_path": "notepad.exe", "wait_seconds": 2.0},
            {"action": "type", "text": "First draft"},
            {"action": "wait", "wait_seconds": 0.5},
            {"action": "hotkey", "keys": ["ctrl", "z"], "description": "Undo"},
            {"action": "wait", "wait_seconds": 0.5},
            {"action": "hotkey", "keys": ["ctrl", "y"], "description": "Redo"},
            {"action": "wait", "wait_seconds": 0.5},
            {"action": "hotkey", "keys": ["ctrl", "a"]},
            {"action": "press_key", "key": "delete"},
        ],
    },
]

FAKE_TESTS = [
    # Invoicing app
    {
        "filename": "invoicing/create_invoice.yaml",
        "name": "Invoicing - Create Invoice",
        "tags": ["invoicing", "smoke"],
        "variables": {"customer": "ACME Corp", "amount": "1250.00"},
        "steps": [
            {"action": "launch_application", "app_path": "C:\\Program Files\\Invoicing\\Invoicing.exe",
             "wait_seconds": 3.0},
            {"action": "click", "click_x": 0.08, "click_y": 0.12, "description": "Open New Invoice"},
            {"action": "wait", "wait_seconds": 1.0},
            {"action": "click", "click_x": 0.32, "click_y": 0.28, "description": "Focus customer field"},
            {"action": "type", "text": "{{customer}}"},
            {"action": "click", "click_x": 0.32, "click_y": 0.41, "description": "Focus amount field"},
            {"action": "type", "text": "{{amount}}"},
            {"action": "click", "click_x": 0.85, "click_y": 0.92, "description": "Click Save"},
            {"action": "wait", "wait_seconds": 2.0},
            {"action": "verify_screenshot", "region": [0.05, 0.10, 0.40, 0.20],
             "baseline_id": "invoice_saved_toast.png", "similarity_threshold": 0.95,
             "description": "Verify 'Invoice saved' toast"},
        ],
    },
    {
        "filename": "invoicing/update_customer.yaml",
        "name": "Invoicing - Update Customer Details",
        "tags": ["invoicing"],
        "steps": [
            {"action": "launch_application", "app_path": "C:\\Program Files\\Invoicing\\Invoicing.exe",
             "wait_seconds": 3.0},
            {"action": "click", "click_x": 0.12, "click_y": 0.22},
            {"action": "wait", "wait_seconds": 0.5},
            {"action": "click", "click_x": 0.45, "click_y": 0.38},
            {"action": "type", "text": "555-0199"},
            {"action": "click", "click_x": 0.85, "click_y": 0.92},
            {"action": "wait", "wait_seconds": 1.0},
        ],
    },
    {
        "filename": "invoicing/pdf_export.yaml",
        "name": "Invoicing - Export PDF",
        "tags": ["invoicing", "regression"],
        "variables": {"output_dir": "C:\\Users\\demo\\Documents\\Invoices"},
        "steps": [
            {"action": "launch_application", "app_path": "C:\\Program Files\\Invoicing\\Invoicing.exe",
             "wait_seconds": 3.0},
            {"action": "click", "click_x": 0.04, "click_y": 0.06, "description": "Open File menu"},
            {"action": "click", "click_x": 0.08, "click_y": 0.18, "description": "Click Export PDF"},
            {"action": "wait", "wait_seconds": 1.0},
            {"action": "type", "text": "{{output_dir}}\\invoice_demo.pdf"},
            {"action": "press_key", "key": "enter"},
            {"action": "wait", "wait_seconds": 2.0},
            {"action": "compare_saved_file", "file_path": "{{output_dir}}",
             "baseline_id": "invoice_demo.pdf", "compare_mode": "exact",
             "description": "Compare exported PDF"},
        ],
    },

    # CRM
    {
        "filename": "crm/add_contact.yaml",
        "name": "CRM - Add Contact",
        "tags": ["crm", "smoke"],
        "variables": {"first_name": "Taylor", "last_name": "Nguyen", "email": "taylor@example.com"},
        "steps": [
            {"action": "launch_application", "app_path": "C:\\Program Files\\CRM\\CRM.exe",
             "wait_seconds": 3.0},
            {"action": "click", "click_x": 0.08, "click_y": 0.14, "description": "Open Contacts"},
            {"action": "click", "click_x": 0.92, "click_y": 0.10, "description": "New Contact"},
            {"action": "wait", "wait_seconds": 0.8},
            {"action": "type", "text": "{{first_name}}"},
            {"action": "press_key", "key": "tab"},
            {"action": "type", "text": "{{last_name}}"},
            {"action": "press_key", "key": "tab"},
            {"action": "type", "text": "{{email}}"},
            {"action": "click", "click_x": 0.85, "click_y": 0.92, "description": "Save"},
            {"action": "wait", "wait_seconds": 1.0},
        ],
    },
    {
        "filename": "crm/search_contact.yaml",
        "name": "CRM - Search Contact",
        "tags": ["crm"],
        "steps": [
            {"action": "launch_application", "app_path": "C:\\Program Files\\CRM\\CRM.exe",
             "wait_seconds": 3.0},
            {"action": "click", "click_x": 0.42, "click_y": 0.06, "description": "Focus search"},
            {"action": "type", "text": "Nguyen"},
            {"action": "press_key", "key": "enter"},
            {"action": "wait", "wait_seconds": 1.0},
        ],
    },
    {
        "filename": "crm/bulk_import.yaml",
        "name": "CRM - Bulk Import Contacts",
        "tags": ["crm", "regression"],
        "steps": [
            {"action": "launch_application", "app_path": "C:\\Program Files\\CRM\\CRM.exe",
             "wait_seconds": 3.0},
            {"action": "click", "click_x": 0.04, "click_y": 0.06},
            {"action": "click", "click_x": 0.08, "click_y": 0.22, "description": "Import from CSV"},
            {"action": "wait", "wait_seconds": 0.5},
            {"action": "type", "text": "C:\\Users\\demo\\Documents\\contacts_500.csv"},
            {"action": "press_key", "key": "enter"},
            {"action": "wait", "wait_seconds": 8.0, "description": "Wait for import"},
            {"action": "verify_screenshot", "region": [0.35, 0.45, 0.65, 0.55],
             "baseline_id": "import_success_banner.png", "similarity_threshold": 0.92,
             "description": "Verify success banner"},
        ],
    },

    # Accounting
    {
        "filename": "accounting/generate_monthly_report.yaml",
        "name": "Accounting - Generate Monthly Report",
        "tags": ["accounting", "regression"],
        "variables": {"month": "March", "year": "2026"},
        "steps": [
            {"action": "launch_application", "app_path": "C:\\Program Files\\Accounting\\Accounting.exe",
             "wait_seconds": 4.0},
            {"action": "click", "click_x": 0.10, "click_y": 0.18, "description": "Reports tab"},
            {"action": "click", "click_x": 0.28, "click_y": 0.32, "description": "Select month"},
            {"action": "type", "text": "{{month}} {{year}}"},
            {"action": "click", "click_x": 0.82, "click_y": 0.90, "description": "Generate"},
            {"action": "wait", "wait_seconds": 5.0},
            {"action": "compare_saved_file",
             "file_path": "C:\\Users\\demo\\Documents\\Accounting\\Reports",
             "baseline_id": "monthly_2026_03.pdf", "compare_mode": "exact"},
        ],
    },
    {
        "filename": "accounting/reconcile_ledger.yaml",
        "name": "Accounting - Reconcile Ledger",
        "tags": ["accounting"],
        "steps": [
            {"action": "launch_application", "app_path": "C:\\Program Files\\Accounting\\Accounting.exe",
             "wait_seconds": 4.0},
            {"action": "click", "click_x": 0.15, "click_y": 0.20, "description": "Ledger"},
            {"action": "click", "click_x": 0.70, "click_y": 0.10, "description": "Reconcile"},
            {"action": "wait", "wait_seconds": 2.0},
            {"action": "loop", "repeat": 3, "loop_target": -2,
             "description": "Retry reconcile up to 3x"},
        ],
    },
    {
        "filename": "accounting/tax_calculation.yaml",
        "name": "Accounting - Tax Calculation",
        "tags": ["accounting", "smoke"],
        "steps": [
            {"action": "launch_application", "app_path": "C:\\Program Files\\Accounting\\Accounting.exe",
             "wait_seconds": 4.0},
            {"action": "click", "click_x": 0.18, "click_y": 0.22},
            {"action": "click", "click_x": 0.35, "click_y": 0.48},
            {"action": "type", "text": "10000"},
            {"action": "click", "click_x": 0.82, "click_y": 0.90},
            {"action": "wait", "wait_seconds": 1.0},
            {"action": "verify_screenshot", "region": [0.30, 0.60, 0.70, 0.75],
             "baseline_id": "tax_result_1850.png", "similarity_threshold": 0.90},
        ],
    },
]

ALL_TESTS = RUNNABLE_TESTS + FAKE_TESTS


# ----------------------------------------------------------------- Suites ----

SUITES = [
    {
        "filename": "notepad_suite.yaml",
        "name": "Notepad Test Suite",
        "description": "Regression tests for Notepad — actually runnable against notepad.exe.",
        "tests": [t["filename"] for t in RUNNABLE_TESTS],
    },
    {
        "filename": "invoicing_regression.yaml",
        "name": "Invoicing Regression",
        "description": "End-to-end regression suite for the Invoicing application.",
        "tests": [
            "invoicing/create_invoice.yaml",
            "invoicing/update_customer.yaml",
            "invoicing/pdf_export.yaml",
        ],
    },
    {
        "filename": "crm_regression.yaml",
        "name": "CRM Regression",
        "description": "Regression suite for the CRM application.",
        "tests": [
            "crm/add_contact.yaml",
            "crm/search_contact.yaml",
            "crm/bulk_import.yaml",
        ],
    },
    {
        "filename": "accounting_regression.yaml",
        "name": "Accounting Regression",
        "description": "Monthly close + reconciliation tests.",
        "tests": [
            "accounting/generate_monthly_report.yaml",
            "accounting/reconcile_ledger.yaml",
            "accounting/tax_calculation.yaml",
        ],
    },
    {
        "filename": "daily_smoke.yaml",
        "name": "Daily Smoke Tests",
        "description": "Fast smoke tests across all applications — runs every morning.",
        "tests": [
            "notepad_basic_text_entry.yaml",
            "invoicing/create_invoice.yaml",
            "crm/add_contact.yaml",
            "accounting/tax_calculation.yaml",
        ],
    },
    {
        "filename": "nightly_full.yaml",
        "name": "Nightly Full Regression",
        "description": "Full regression suite — runs every weeknight.",
        "tests": [t["filename"] for t in ALL_TESTS],
        "settings": {"fail_fast": False},
    },
]


# -------------------------------------------------------------- Pipelines ----

PIPELINES = [
    {
        "filename": "nightly_smoke.yaml",
        "name": "Nightly Smoke",
        "enabled": True,
        "target_type": "suite",
        "target_file": "daily_smoke.yaml",
        "schedule_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "schedule_time": "22:00",
    },
    {
        "filename": "weekly_full_regression.yaml",
        "name": "Weekly Full Regression",
        "enabled": True,
        "target_type": "suite",
        "target_file": "nightly_full.yaml",
        "schedule_days": ["saturday"],
        "schedule_time": "02:00",
    },
    {
        "filename": "morning_notepad_check.yaml",
        "name": "Morning Notepad Check",
        "enabled": True,
        "target_type": "suite",
        "target_file": "notepad_suite.yaml",
        "schedule_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "schedule_time": "08:30",
    },
    {
        "filename": "invoicing_nightly.yaml",
        "name": "Invoicing Nightly",
        "enabled": True,
        "target_type": "suite",
        "target_file": "invoicing_regression.yaml",
        "schedule_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "schedule_time": "23:30",
    },
    {
        "filename": "accounting_month_end.yaml",
        "name": "Accounting Month-End",
        "enabled": False,
        "target_type": "test",
        "target_file": "accounting/generate_monthly_report.yaml",
        "schedule_days": ["friday"],
        "schedule_time": "20:00",
    },
]


# --------------------------------------------------------- Report generator --

REALISTIC_ERRORS = [
    "Element not visible after 5 retry attempts",
    "Files differ at byte 1247\nActual: C:\\Users\\demo\\Documents\\output.pdf\nBaseline: C:\\workspace\\baselines\\expected_output.pdf",
    "Image differs (similarity: 86.3%)\nActual: crop_0.png\nBaseline: expected_screenshot.png",
    "Application did not launch within 10s",
    "Unexpected dialog appeared: 'Save changes?'",
]


def _duration_for_action(action: str, configured: float = 0.0) -> float:
    if action == "launch_application":
        return round(random.uniform(2.0, 5.0) + (configured or 0), 2)
    if action == "wait":
        return round((configured or 1.0) + random.uniform(0.0, 0.05), 2)
    if action in ("click", "double_click", "right_click"):
        return round(random.uniform(0.25, 0.85), 2)
    if action == "type":
        return round(random.uniform(0.2, 1.2), 2)
    if action in ("press_key", "hotkey"):
        return round(random.uniform(0.15, 0.45), 2)
    if action in ("compare_saved_file", "verify_screenshot"):
        return round(random.uniform(0.5, 2.0), 2)
    if action == "loop":
        return round(random.uniform(1.0, 4.0), 2)
    return round(random.uniform(0.1, 0.6), 2)


def _safe_dirname(name: str) -> str:
    return "".join(c if c.isalnum() or c in "-_" else "_" for c in name)


def _build_report_step(step: dict, will_pass: bool) -> dict:
    action = step["action"]
    description = step.get("description", "")
    target = step.get("target")
    duration = _duration_for_action(action, step.get("wait_seconds", 0.0))
    coordinates = None
    if step.get("click_x") is not None and step.get("click_y") is not None:
        # Approximate pixel coords on a 2560x1440 screen
        coordinates = [int(step["click_x"] * 2560), int(step["click_y"] * 1440)]

    model_response = None
    if action == "compare_saved_file":
        fp = step.get("file_path", "C:\\output")
        bid = step.get("baseline_id", "baseline.bin")
        if will_pass:
            size = random.randint(50_000, 2_500_000)
            model_response = f"Files match ({size} bytes)\nActual: {fp}\\{bid}\nBaseline: {bid}"
    elif action == "verify_screenshot":
        if will_pass:
            model_response = f"Image similarity: {random.uniform(0.92, 0.99):.1%}"

    error = None if will_pass else random.choice(REALISTIC_ERRORS)

    return {
        "description": description,
        "action": action,
        "target": target,
        "passed": will_pass,
        "duration_seconds": duration,
        "error": error,
        "coordinates": coordinates,
        "model_response": model_response,
        "screenshot_path": None,
    }


def _generate_report(test: dict, when: datetime, force_failure: bool = False) -> tuple[str, dict]:
    steps = test["steps"]
    total = len(steps)
    failed_step_idx = -1
    if force_failure:
        # Pick a later-ish step to fail
        failed_step_idx = random.randint(max(1, total - 3), total - 1)

    step_results = []
    for i, step in enumerate(steps):
        will_pass = (failed_step_idx == -1) or (i < failed_step_idx)
        step_results.append(_build_report_step(step, will_pass))
        if i == failed_step_idx:
            # Stop executing after first failure (like the real runner)
            break

    passed_count = sum(1 for s in step_results if s["passed"])
    failed_count = sum(1 for s in step_results if not s["passed"])
    overall_passed = failed_count == 0

    report = {
        "test_name": test["name"],
        "passed": overall_passed,
        "summary": {
            "total": len(step_results),
            "passed": passed_count,
            "failed": failed_count,
        },
        "generated_at": when.isoformat(),
        "steps": step_results,
    }
    dir_name = f"{when.strftime('%Y-%m-%d_%H%M%S')}_{_safe_dirname(test['name'])}"
    return dir_name, report


# ----------------------------------------------------------------- Writers ---

def write_tests(workspace: Path) -> None:
    tests_dir = workspace / "tests"
    tests_dir.mkdir(parents=True, exist_ok=True)
    for test in ALL_TESTS:
        path = tests_dir / test["filename"]
        path.parent.mkdir(parents=True, exist_ok=True)
        data = {"name": test["name"]}
        if test.get("tags"):
            data["tags"] = test["tags"]
        if test.get("variables"):
            data["variables"] = test["variables"]
        data["steps"] = test["steps"]
        with open(path, "w") as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
    print(f"  Wrote {len(ALL_TESTS)} tests")


def write_suites(workspace: Path) -> None:
    suites_dir = workspace / "test_suites"
    suites_dir.mkdir(parents=True, exist_ok=True)
    for suite in SUITES:
        path = suites_dir / suite["filename"]
        data = {
            "name": suite["name"],
            "description": suite.get("description", ""),
            "tests": [{"path": p} for p in suite["tests"]],
        }
        if suite.get("settings"):
            data["settings"] = suite["settings"]
        with open(path, "w") as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
    print(f"  Wrote {len(SUITES)} test suites")


def write_pipelines(workspace: Path) -> None:
    pipelines_dir = workspace / "pipelines"
    pipelines_dir.mkdir(parents=True, exist_ok=True)
    for pipeline in PIPELINES:
        path = pipelines_dir / pipeline["filename"]
        data = {
            "name": pipeline["name"],
            "enabled": pipeline["enabled"],
            "target_type": pipeline["target_type"],
            "target_file": pipeline["target_file"],
            "schedule": {
                "days": pipeline["schedule_days"],
                "time": pipeline["schedule_time"],
            },
        }
        with open(path, "w") as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
    print(f"  Wrote {len(PIPELINES)} pipelines")


def write_reports(workspace: Path, days: int = 21, per_day_range=(2, 6)) -> None:
    reports_dir = workspace / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now().replace(microsecond=0)
    count = 0
    for day_offset in range(days):
        day = now - timedelta(days=day_offset)
        n = random.randint(*per_day_range)
        for _ in range(n):
            test = random.choice(ALL_TESTS)
            # Most runs pass; failures cluster recently
            recent = day_offset < 5
            fail_chance = 0.22 if recent else 0.08
            force_fail = random.random() < fail_chance
            hour = random.randint(7, 23)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            when = day.replace(hour=hour, minute=minute, second=second)

            dir_name, report = _generate_report(test, when, force_failure=force_fail)
            out_dir = reports_dir / dir_name
            out_dir.mkdir(parents=True, exist_ok=True)
            (out_dir / "report.json").write_text(json.dumps(report, indent=2))
            count += 1
    print(f"  Wrote {count} reports spanning {days} days")


# ------------------------------------------------------------------- Main ----

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", "-w", required=True, type=Path,
                        help="Workspace root directory")
    parser.add_argument("--clear", action="store_true",
                        help="Wipe existing tests/suites/pipelines/reports first")
    parser.add_argument("--days", type=int, default=21,
                        help="How many days of report history to generate (default: 21)")
    parser.add_argument("--seed", type=int, default=None,
                        help="Random seed for reproducible output")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    ws = args.workspace.resolve()
    ws.mkdir(parents=True, exist_ok=True)
    print(f"Workspace: {ws}")

    if args.clear:
        for sub in ("tests", "test_suites", "pipelines", "reports"):
            p = ws / sub
            if p.exists():
                shutil.rmtree(p)
                print(f"  Cleared {sub}/")

    print("Generating demo data...")
    write_tests(ws)
    write_suites(ws)
    write_pipelines(ws)
    write_reports(ws, days=args.days)
    print("Done.")


if __name__ == "__main__":
    main()
