"""Tests for the loop step execution logic."""

import pytest

from wintest.steps.loop import execute
from wintest.tasks.schema import Step, StepResult
from wintest.tasks.variables import VariableStore


def make_ctx(**overrides):
    ctx = {
        "loop_counters": {},
        "current_step_index": 4,
        "variables": VariableStore(),
    }
    ctx.update(overrides)
    return ctx


class TestLoopExecution:
    def test_first_hit_jumps_back(self):
        step = Step(action="loop", loop_target=2, repeat=3)
        ctx = make_ctx(current_step_index=4)
        result = execute(step, ctx)
        assert result.passed
        assert ctx["jump_to"] == 1  # 0-indexed: step 2 -> index 1

    def test_counter_increments(self):
        step = Step(action="loop", loop_target=1, repeat=3)
        ctx = make_ctx(current_step_index=4)

        execute(step, ctx)
        assert ctx["loop_counters"][4] == 1

        # Simulate second hit
        ctx.pop("jump_to", None)
        execute(step, ctx)
        assert ctx["loop_counters"][4] == 2

    def test_exhausted_after_repeat_count(self):
        step = Step(action="loop", loop_target=1, repeat=2)
        ctx = make_ctx(current_step_index=4)

        # Hit 1: jump
        execute(step, ctx)
        assert "jump_to" in ctx

        # Hit 2: jump
        ctx.pop("jump_to")
        execute(step, ctx)
        assert "jump_to" in ctx

        # Hit 3: exhausted, no jump
        ctx.pop("jump_to")
        execute(step, ctx)
        assert "jump_to" not in ctx
        assert 4 not in ctx["loop_counters"]  # counter cleaned up

    def test_sets_loop_index_variable(self):
        step = Step(action="loop", loop_target=1, repeat=3)
        variables = VariableStore()
        ctx = make_ctx(current_step_index=4, variables=variables)

        execute(step, ctx)
        assert variables.get("loop_index") == "1"

        ctx.pop("jump_to")
        execute(step, ctx)
        assert variables.get("loop_index") == "2"

    def test_independent_loop_counters(self):
        step_a = Step(action="loop", loop_target=1, repeat=2)
        step_b = Step(action="loop", loop_target=3, repeat=1)
        counters = {}

        ctx_a = make_ctx(current_step_index=2, loop_counters=counters)
        ctx_b = make_ctx(current_step_index=5, loop_counters=counters)

        execute(step_a, ctx_a)
        execute(step_b, ctx_b)

        assert counters[2] == 1
        assert counters[5] == 1

    def test_loop_target_converts_to_zero_indexed(self):
        """loop_target=3 should produce jump_to=2 (0-indexed)."""
        step = Step(action="loop", loop_target=3, repeat=1)
        ctx = make_ctx(current_step_index=4)
        execute(step, ctx)
        assert ctx["jump_to"] == 2
