"""Tests for YAML loaders: test loader and test suite loader."""

import pytest

from wintest.tasks.loader import load_test
from wintest.tasks.test_suite_loader import load_test_suite
from wintest.config.settings import Settings


class TestLoadTest:
    def test_minimal_valid(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text(
            "name: My Test\n"
            "steps:\n"
            "  - action: click\n"
            "    target: OK button\n"
        )
        test = load_test(str(f))
        assert test.name == "My Test"
        assert len(test.steps) == 1
        assert test.steps[0].action == "click"
        assert test.steps[0].target == "OK button"

    def test_step_fields_mapped(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text(
            "name: Full\n"
            "steps:\n"
            "  - action: type\n"
            "    text: hello\n"
            "    description: Type hello\n"
            "    retry_attempts: 5\n"
            "    retry_delay: 1.0\n"
            "    timeout: 30\n"
        )
        test = load_test(str(f))
        step = test.steps[0]
        assert step.text == "hello"
        assert step.description == "Type hello"
        assert step.retry_attempts == 5
        assert step.retry_delay == 1.0
        assert step.timeout == 30

    def test_expected_defaults_to_true(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text(
            "name: T\n"
            "steps:\n"
            "  - action: verify\n"
            "    target: button\n"
        )
        test = load_test(str(f))
        assert test.steps[0].expected is True

    def test_expected_false(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text(
            "name: T\n"
            "steps:\n"
            "  - action: verify\n"
            "    target: button\n"
            "    expected: false\n"
        )
        test = load_test(str(f))
        assert test.steps[0].expected is False

    def test_settings_section_preserved(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text(
            "name: T\n"
            "steps:\n"
            "  - action: wait\n"
            "    wait_seconds: 1\n"
            "settings:\n"
            "  fail_fast: true\n"
            "  retry_attempts: 5\n"
        )
        test = load_test(str(f))
        assert test.settings["fail_fast"] is True
        assert test.settings["retry_attempts"] == 5

    def test_retry_defaults_from_settings(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text(
            "name: T\n"
            "steps:\n"
            "  - action: click\n"
            "    target: OK\n"
        )
        settings = Settings()
        settings.retry.retry_attempts = 7
        test = load_test(str(f), settings=settings)
        assert test.steps[0].retry_attempts == 7

    def test_missing_name_raises(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text("steps:\n  - action: click\n    target: OK\n")
        with pytest.raises(ValueError, match="missing required 'name' field"):
            load_test(str(f))

    def test_missing_steps_raises(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text("name: T\n")
        with pytest.raises(ValueError, match="missing or empty 'steps' field"):
            load_test(str(f))

    def test_empty_steps_raises(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text("name: T\nsteps: []\n")
        with pytest.raises(ValueError, match="missing or empty 'steps' field"):
            load_test(str(f))

    def test_missing_action_raises(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text("name: T\nsteps:\n  - target: OK\n")
        with pytest.raises(ValueError, match="missing required 'action' field"):
            load_test(str(f))

    def test_unknown_action_raises(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text("name: T\nsteps:\n  - action: fly\n")
        with pytest.raises(ValueError, match="unknown action 'fly'"):
            load_test(str(f))

    def test_multiple_steps(self, tmp_path):
        f = tmp_path / "test.yaml"
        f.write_text(
            "name: Multi\n"
            "steps:\n"
            "  - action: click\n"
            "    target: File menu\n"
            "  - action: type\n"
            "    text: hello\n"
            "  - action: press_key\n"
            "    key: enter\n"
        )
        test = load_test(str(f))
        assert len(test.steps) == 3
        assert test.steps[0].action == "click"
        assert test.steps[1].action == "type"
        assert test.steps[2].action == "press_key"


class TestLoadTestSuite:
    def test_string_entries(self, tmp_path):
        f = tmp_path / "suite.yaml"
        f.write_text(
            "name: My Suite\n"
            "tests:\n"
            "  - path/a.yaml\n"
            "  - path/b.yaml\n"
        )
        suite = load_test_suite(str(f))
        assert suite.name == "My Suite"
        assert suite.test_paths == ["path/a.yaml", "path/b.yaml"]

    def test_dict_entries(self, tmp_path):
        f = tmp_path / "suite.yaml"
        f.write_text(
            "name: Suite\n"
            "tests:\n"
            "  - path: a.yaml\n"
            "  - path: b.yaml\n"
        )
        suite = load_test_suite(str(f))
        assert suite.test_paths == ["a.yaml", "b.yaml"]

    def test_mixed_entries(self, tmp_path):
        f = tmp_path / "suite.yaml"
        f.write_text(
            "name: Suite\n"
            "tests:\n"
            "  - simple.yaml\n"
            "  - path: dict_entry.yaml\n"
        )
        suite = load_test_suite(str(f))
        assert suite.test_paths == ["simple.yaml", "dict_entry.yaml"]

    def test_description_and_settings(self, tmp_path):
        f = tmp_path / "suite.yaml"
        f.write_text(
            "name: Suite\n"
            "description: A test suite\n"
            "tests:\n"
            "  - a.yaml\n"
            "settings:\n"
            "  fail_fast: false\n"
        )
        suite = load_test_suite(str(f))
        assert suite.description == "A test suite"
        assert suite.settings == {"fail_fast": False}

    def test_description_defaults_empty(self, tmp_path):
        f = tmp_path / "suite.yaml"
        f.write_text("name: Suite\ntests:\n  - a.yaml\n")
        suite = load_test_suite(str(f))
        assert suite.description == ""
        assert suite.settings == {}

    def test_missing_name_raises(self, tmp_path):
        f = tmp_path / "suite.yaml"
        f.write_text("tests:\n  - a.yaml\n")
        with pytest.raises(ValueError, match="missing required 'name' field"):
            load_test_suite(str(f))

    def test_missing_tests_raises(self, tmp_path):
        f = tmp_path / "suite.yaml"
        f.write_text("name: Suite\n")
        with pytest.raises(ValueError, match="missing or empty 'tests' field"):
            load_test_suite(str(f))

    def test_empty_tests_raises(self, tmp_path):
        f = tmp_path / "suite.yaml"
        f.write_text("name: Suite\ntests: []\n")
        with pytest.raises(ValueError, match="missing or empty 'tests' field"):
            load_test_suite(str(f))

    def test_invalid_entry_raises(self, tmp_path):
        f = tmp_path / "suite.yaml"
        f.write_text("name: Suite\ntests:\n  - foo: bar\n")
        with pytest.raises(ValueError, match="must be a string or an object with a 'path' field"):
            load_test_suite(str(f))
