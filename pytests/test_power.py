"""Tests for wintest.core.power module."""

from unittest.mock import patch, MagicMock
import pytest

from wintest.core.power import (
    prevent_sleep,
    allow_sleep,
    ES_CONTINUOUS,
    ES_SYSTEM_REQUIRED,
    ES_DISPLAY_REQUIRED,
)


@pytest.fixture
def mock_kernel32():
    mock = MagicMock()
    with patch("wintest.core.power.ctypes") as ctypes_mock:
        ctypes_mock.windll.kernel32 = mock
        yield mock


class TestPreventSleep:
    def test_calls_set_thread_execution_state(self, mock_kernel32):
        mock_kernel32.SetThreadExecutionState.return_value = 1
        result = prevent_sleep()
        expected_flags = ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
        mock_kernel32.SetThreadExecutionState.assert_called_once_with(expected_flags)
        assert result is True

    def test_returns_false_on_failure(self, mock_kernel32):
        mock_kernel32.SetThreadExecutionState.return_value = 0
        result = prevent_sleep()
        assert result is False

    def test_returns_false_on_exception(self):
        with patch("wintest.core.power.ctypes") as ctypes_mock:
            ctypes_mock.windll.kernel32.SetThreadExecutionState.side_effect = OSError("no kernel32")
            result = prevent_sleep()
            assert result is False


class TestAllowSleep:
    def test_calls_set_thread_execution_state_continuous_only(self, mock_kernel32):
        mock_kernel32.SetThreadExecutionState.return_value = 1
        result = allow_sleep()
        mock_kernel32.SetThreadExecutionState.assert_called_once_with(ES_CONTINUOUS)
        assert result is True

    def test_returns_false_on_failure(self, mock_kernel32):
        mock_kernel32.SetThreadExecutionState.return_value = 0
        result = allow_sleep()
        assert result is False
