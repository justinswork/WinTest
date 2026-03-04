"""Tests for the Settings cascade: defaults, YAML loading, and merge behavior."""

import pytest

from wintest.config.settings import Settings


class TestSettingsDefaults:
    def test_constructs_without_error(self):
        s = Settings()
        assert s is not None

    def test_retry_defaults(self):
        s = Settings()
        assert s.retry.retry_attempts == 3
        assert s.retry.retry_delay == 2.0

    def test_action_defaults(self):
        s = Settings()
        assert s.action.action_delay == 0.5
        assert s.action.failsafe is True
        assert s.action.type_interval == 0.05
        assert s.action.coordinate_scale == 1000

    def test_timeout_defaults(self):
        s = Settings()
        assert s.timeout.step_timeout == 60.0
        assert s.timeout.test_timeout == 600.0

    def test_recovery_defaults(self):
        s = Settings()
        assert s.recovery.enabled is True
        assert s.recovery.max_recovery_attempts == 2
        assert s.recovery.dismiss_dialog_keys == ["escape"]
        assert s.recovery.recovery_delay == 1.0

    def test_app_defaults(self):
        s = Settings()
        assert s.app.wait_after_launch == 3.0
        assert s.app.focus_delay == 0.3
        assert s.app.graceful_close_timeout == 5.0

    def test_model_defaults(self):
        s = Settings()
        assert s.model.model_path == "OpenGVLab/InternVL2-8B"
        assert s.model.load_in_4bit is True
        assert s.model.input_size == 448


class TestSettingsLoad:
    def test_load_nonexistent_file_returns_defaults(self):
        s = Settings.load("nonexistent_config_xyz.yaml")
        assert s.retry.retry_attempts == 3
        assert s.timeout.step_timeout == 60.0

    def test_load_partial_override(self, tmp_path):
        config = tmp_path / "config.yaml"
        config.write_text("retry:\n  retry_attempts: 5\n")
        s = Settings.load(str(config))
        assert s.retry.retry_attempts == 5
        assert s.retry.retry_delay == 2.0  # unchanged default

    def test_load_nested_section(self, tmp_path):
        config = tmp_path / "config.yaml"
        config.write_text("model:\n  max_new_tokens: 100\n")
        s = Settings.load(str(config))
        assert s.model.max_new_tokens == 100
        assert s.model.model_path == "OpenGVLab/InternVL2-8B"  # unchanged

    def test_unknown_keys_ignored(self, tmp_path):
        config = tmp_path / "config.yaml"
        config.write_text("retry:\n  nonexistent_key: 999\n")
        s = Settings.load(str(config))
        assert s.retry.retry_attempts == 3  # unchanged
        assert not hasattr(s.retry, "nonexistent_key")

    def test_empty_file(self, tmp_path):
        config = tmp_path / "config.yaml"
        config.write_text("")
        s = Settings.load(str(config))
        assert s.retry.retry_attempts == 3


class TestSettingsMerge:
    def test_flat_retry_attempts(self):
        s = Settings()
        s._merge({"retry_attempts": 7})
        assert s.retry.retry_attempts == 7

    def test_flat_retry_delay(self):
        s = Settings()
        s._merge({"retry_delay": 5.0})
        assert s.retry.retry_delay == 5.0

    def test_nested_and_flat_both_work(self):
        s = Settings()
        s._merge({"retry": {"retry_attempts": 10}})
        assert s.retry.retry_attempts == 10

    def test_merge_test_settings_returns_copy(self):
        original = Settings()
        merged = original.merge_test_settings({"retry_attempts": 10})
        assert merged.retry.retry_attempts == 10
        assert original.retry.retry_attempts == 3  # unchanged

    def test_merge_test_settings_deep_copy(self):
        original = Settings()
        merged = original.merge_test_settings({"retry_attempts": 10})
        # Modifying merged should not affect original
        merged.retry.retry_delay = 99.0
        assert original.retry.retry_delay == 2.0
