"""Tests for Pydantic models in wintest.ui.web.models."""

import pytest
from pydantic import ValidationError

from wintest.ui.web.models import (
    StepModel, TestModel, RunStatus, ValidationResult,
    ReportSummary, TestSuiteModel, TestSuiteListItem,
)


class TestStepModel:
    def test_minimal(self):
        s = StepModel(action="click")
        assert s.action == "click"
        assert s.description == ""
        assert s.target is None
        assert s.expected is True
        assert s.retry_attempts == 3
        assert s.retry_delay == 2.0

    def test_action_required(self):
        with pytest.raises(ValidationError):
            StepModel()

    def test_all_fields(self):
        s = StepModel(
            action="hotkey",
            description="Copy",
            keys=["ctrl", "c"],
            expected=False,
            retry_attempts=5,
            timeout=30.0,
        )
        assert s.keys == ["ctrl", "c"]
        assert s.expected is False
        assert s.timeout == 30.0


class TestTestModel:
    def test_minimal(self):
        t = TestModel(name="T", steps=[StepModel(action="click")])
        assert t.name == "T"
        assert t.filename is None
        assert t.settings == {}
        assert len(t.steps) == 1

    def test_name_required(self):
        with pytest.raises(ValidationError):
            TestModel(steps=[StepModel(action="click")])

    def test_steps_required(self):
        with pytest.raises(ValidationError):
            TestModel(name="T")


class TestRunStatus:
    def test_status_required(self):
        with pytest.raises(ValidationError):
            RunStatus()

    def test_defaults(self):
        rs = RunStatus(status="idle")
        assert rs.run_id is None
        assert rs.step_results == []


class TestValidationResult:
    def test_valid(self):
        vr = ValidationResult(valid=True, issues=[])
        assert vr.valid is True

    def test_invalid(self):
        vr = ValidationResult(valid=False, issues=["Step 1: error"])
        assert len(vr.issues) == 1


class TestReportSummary:
    def test_all_fields_required(self):
        with pytest.raises(ValidationError):
            ReportSummary(report_id="id", test_name="T")  # missing other fields

    def test_valid(self):
        rs = ReportSummary(
            report_id="id",
            test_name="T",
            passed=True,
            total=3,
            passed_count=3,
            failed_count=0,
            generated_at="2026-01-01",
        )
        assert rs.passed is True


class TestTestSuiteModel:
    def test_minimal(self):
        ts = TestSuiteModel(name="Suite", test_paths=["a.yaml"])
        assert ts.filename is None
        assert ts.description == ""
        assert ts.settings == {}

    def test_name_required(self):
        with pytest.raises(ValidationError):
            TestSuiteModel(test_paths=["a.yaml"])
