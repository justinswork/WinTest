"""Tests for dataclasses in wintest.tasks.schema."""

import pytest

from wintest.tasks.schema import (
    Step, StepResult, TestResult, TestDefinition,
    TestSuiteDefinition, TestSuiteResult,
)


def _step(action="click", **kwargs):
    return Step(action=action, **kwargs)


def _result(passed=True, **kwargs):
    return StepResult(step=_step(), passed=passed, **kwargs)


class TestStepDefaults:
    def test_defaults(self):
        s = Step(action="click")
        assert s.description == ""
        assert s.target is None
        assert s.text is None
        assert s.key is None
        assert s.keys is None
        assert s.scroll_amount == 0
        assert s.wait_seconds == 0.0
        assert s.expected is True
        assert s.retry_attempts == 3
        assert s.retry_delay == 2.0
        assert s.timeout is None
        assert s.app_path is None
        assert s.app_title is None


class TestTestResult:
    def test_all_pass(self):
        result = TestResult("test", [_result(True), _result(True), _result(True)])
        assert result.passed is True
        assert result.summary == {"total": 3, "passed": 3, "failed": 0}

    def test_one_failure(self):
        result = TestResult("test", [_result(True), _result(False), _result(True)])
        assert result.passed is False
        assert result.summary == {"total": 3, "passed": 2, "failed": 1}

    def test_all_fail(self):
        result = TestResult("test", [_result(False), _result(False)])
        assert result.passed is False
        assert result.summary == {"total": 2, "passed": 0, "failed": 2}

    def test_empty_results(self):
        result = TestResult("test", [])
        assert result.passed is True  # vacuous truth
        assert result.summary == {"total": 0, "passed": 0, "failed": 0}

    def test_single_pass(self):
        result = TestResult("test", [_result(True)])
        assert result.passed is True
        assert result.summary == {"total": 1, "passed": 1, "failed": 0}

    def test_single_fail(self):
        result = TestResult("test", [_result(False)])
        assert result.passed is False
        assert result.summary == {"total": 1, "passed": 0, "failed": 1}


class TestTestSuiteResult:
    def _test_result(self, passed=True):
        steps = [_result(passed)]
        return TestResult("sub_test", steps)

    def test_all_tests_pass(self):
        suite = TestSuiteResult("suite", [self._test_result(True), self._test_result(True)])
        assert suite.passed is True
        assert suite.summary == {"total_tests": 2, "passed": 2, "failed": 0}

    def test_one_test_fails(self):
        suite = TestSuiteResult("suite", [self._test_result(True), self._test_result(False)])
        assert suite.passed is False
        assert suite.summary == {"total_tests": 2, "passed": 1, "failed": 1}

    def test_empty_suite(self):
        suite = TestSuiteResult("suite", [])
        assert suite.passed is True
        assert suite.summary == {"total_tests": 0, "passed": 0, "failed": 0}

    def test_summary_key_is_total_tests(self):
        """TestSuiteResult uses 'total_tests', not 'total' like TestResult."""
        suite = TestSuiteResult("suite", [self._test_result(True)])
        assert "total_tests" in suite.summary
        assert "total" not in suite.summary


class TestStepResult:
    def test_defaults(self):
        r = StepResult(step=_step(), passed=True)
        assert r.error is None
        assert r.coordinates is None
        assert r.model_response is None
        assert r.screenshot_path is None
        assert r.duration_seconds == 0.0

    def test_with_error(self):
        r = StepResult(step=_step(), passed=False, error="element not found")
        assert r.passed is False
        assert r.error == "element not found"


class TestAppConfig:
    def test_process_name_from_simple_path(self):
        from wintest.core.app_manager import AppConfig

        config = AppConfig(path="notepad.exe")
        assert config.process_name == "notepad.exe"

    def test_process_name_from_forward_slash_path(self):
        from wintest.core.app_manager import AppConfig

        config = AppConfig(path="C:/Windows/notepad.exe")
        assert config.process_name == "notepad.exe"

    def test_process_name_from_backslash_path(self):
        from wintest.core.app_manager import AppConfig

        config = AppConfig(path="C:\\Windows\\notepad.exe")
        assert config.process_name == "notepad.exe"

    def test_process_name_deep_path(self):
        from wintest.core.app_manager import AppConfig

        config = AppConfig(path="C:\\Windows\\System32\\cmd.exe")
        assert config.process_name == "cmd.exe"

    def test_explicit_process_name_preserved(self):
        from wintest.core.app_manager import AppConfig

        config = AppConfig(path="notepad.exe", process_name="custom.exe")
        assert config.process_name == "custom.exe"
