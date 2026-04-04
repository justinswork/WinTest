"""Prevent Windows from sleeping or turning off the display during test runs."""

import ctypes
import logging

logger = logging.getLogger(__name__)

ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002

_KEEP_AWAKE_FLAGS = ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED


def prevent_sleep() -> bool:
    """Tell Windows to stay awake and keep the display on.

    Returns True if the call succeeded.
    """
    try:
        result = ctypes.windll.kernel32.SetThreadExecutionState(_KEEP_AWAKE_FLAGS)
        if result == 0:
            logger.warning("SetThreadExecutionState failed to prevent sleep.")
            return False
        logger.debug("Sleep prevention enabled.")
        return True
    except Exception as e:
        logger.warning("Could not prevent sleep: %s", e)
        return False


def allow_sleep() -> bool:
    """Restore the default sleep/display behavior.

    Returns True if the call succeeded.
    """
    try:
        result = ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS)
        if result == 0:
            logger.warning("SetThreadExecutionState failed to restore sleep.")
            return False
        logger.debug("Sleep prevention disabled.")
        return True
    except Exception as e:
        logger.warning("Could not restore sleep settings: %s", e)
        return False
