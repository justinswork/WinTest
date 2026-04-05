import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18next before importing the store
vi.mock('i18next', () => ({
  default: { t: (key: string) => key },
}));

// Mock the API client so no HTTP calls are made
vi.mock('../api/client', () => ({
  executionApi: {
    run: vi.fn(),
    cancel: vi.fn(),
    status: vi.fn(),
    modelStatus: vi.fn(),
    loadModel: vi.fn(),
  },
}));

import { useExecutionStore } from '../stores/executionStore';
import type { WsMessage } from '../api/types';

function getStore() {
  return useExecutionStore.getState();
}

function dispatch(msg: object) {
  getStore().handleWsMessage(msg as WsMessage);
}

beforeEach(() => {
  getStore().reset();
});

describe('executionStore initial state', () => {
  it('starts idle', () => {
    expect(getStore().status).toBe('idle');
  });

  it('starts with null runId and testName', () => {
    expect(getStore().runId).toBeNull();
    expect(getStore().testName).toBeNull();
  });

  it('starts with empty stepResults', () => {
    expect(getStore().stepResults).toEqual([]);
  });

  it('starts with not_loaded model status', () => {
    expect(getStore().modelStatus).toBe('not_loaded');
  });
});

describe('handleWsMessage: run_started', () => {
  it('sets status to running', () => {
    dispatch({ type: 'run_started', run_id: 'r1', test_name: 'My Test', total_steps: 5 });
    expect(getStore().status).toBe('running');
  });

  it('sets runId and testName', () => {
    dispatch({ type: 'run_started', run_id: 'abc', test_name: 'Test', total_steps: 3 });
    expect(getStore().runId).toBe('abc');
    expect(getStore().testName).toBe('Test');
  });

  it('sets totalSteps', () => {
    dispatch({ type: 'run_started', total_steps: 7 });
    expect(getStore().totalSteps).toBe(7);
  });

  it('resets currentStep and stepResults', () => {
    dispatch({ type: 'run_started', run_id: 'r1', test_name: 'T', total_steps: 2 });
    dispatch({ type: 'step_started', step_num: 1, label: 'Step 1' });
    dispatch({ type: 'run_started', run_id: 'r2', test_name: 'T2', total_steps: 1 });
    expect(getStore().currentStep).toBe(0);
    expect(getStore().stepResults).toEqual([]);
  });

  it('clears error', () => {
    // Force an error state first
    dispatch({ type: 'run_failed', error: 'previous error' });
    dispatch({ type: 'run_started', run_id: 'r1', test_name: 'T', total_steps: 1 });
    expect(getStore().error).toBeNull();
  });
});

describe('handleWsMessage: step_started', () => {
  it('sets currentStep and currentLabel', () => {
    dispatch({ type: 'step_started', step_num: 2, label: 'Click OK' });
    expect(getStore().currentStep).toBe(2);
    expect(getStore().currentLabel).toBe('Click OK');
  });
});

describe('handleWsMessage: step_completed', () => {
  it('appends step result', () => {
    dispatch({
      type: 'step_completed',
      step_num: 1,
      passed: true,
      label: 'Click OK',
      action: 'click',
      duration_seconds: 1.5,
    });
    expect(getStore().stepResults).toHaveLength(1);
    expect(getStore().stepResults[0].passed).toBe(true);
    expect(getStore().stepResults[0].step_num).toBe(1);
    expect(getStore().stepResults[0].action).toBe('click');
  });

  it('does not duplicate a step_num already in results', () => {
    dispatch({ type: 'step_completed', step_num: 1, passed: true });
    dispatch({ type: 'step_completed', step_num: 1, passed: false });
    expect(getStore().stepResults).toHaveLength(1);
    expect(getStore().stepResults[0].passed).toBe(true); // first one kept
  });

  it('accumulates multiple distinct steps', () => {
    dispatch({ type: 'step_completed', step_num: 1, passed: true });
    dispatch({ type: 'step_completed', step_num: 2, passed: false });
    expect(getStore().stepResults).toHaveLength(2);
  });

  it('maps error field', () => {
    dispatch({ type: 'step_completed', step_num: 1, passed: false, error: 'element not found' });
    expect(getStore().stepResults[0].error).toBe('element not found');
  });

  it('defaults passed to false when missing', () => {
    dispatch({ type: 'step_completed', step_num: 1 });
    expect(getStore().stepResults[0].passed).toBe(false);
  });
});

describe('handleWsMessage: run_completed', () => {
  it('sets status to completed when passed', () => {
    dispatch({ type: 'run_completed', passed: true });
    expect(getStore().status).toBe('completed');
  });

  it('sets status to failed when not passed', () => {
    dispatch({ type: 'run_completed', passed: false });
    expect(getStore().status).toBe('failed');
  });
});

describe('handleWsMessage: run_cancelled', () => {
  it('sets status to cancelled', () => {
    dispatch({ type: 'run_cancelled' });
    expect(getStore().status).toBe('cancelled');
  });
});

describe('handleWsMessage: run_failed', () => {
  it('sets status to failed', () => {
    dispatch({ type: 'run_failed', error: 'crash' });
    expect(getStore().status).toBe('failed');
  });

  it('sets error message', () => {
    dispatch({ type: 'run_failed', error: 'something broke' });
    expect(getStore().error).toBe('something broke');
  });

  it('falls back to i18n key when error missing', () => {
    dispatch({ type: 'run_failed' });
    // i18next mock returns the key itself
    expect(getStore().error).toBe('errors.unknownError');
  });
});

describe('handleWsMessage: model_loading / model_loaded', () => {
  it('sets modelStatus to loading', () => {
    dispatch({ type: 'model_loading' });
    expect(getStore().modelStatus).toBe('loading');
  });

  it('sets modelStatus to loaded', () => {
    dispatch({ type: 'model_loaded' });
    expect(getStore().modelStatus).toBe('loaded');
  });
});

describe('handleWsMessage: run_status', () => {
  it('restores full state from snapshot', () => {
    dispatch({
      type: 'run_status',
      status: 'running',
      run_id: 'snap-1',
      test_name: 'Snapshot Test',
      current_step: 3,
      total_steps: 10,
      step_results: [{ step_num: 1, passed: true }],
    });
    const state = getStore();
    expect(state.status).toBe('running');
    expect(state.runId).toBe('snap-1');
    expect(state.testName).toBe('Snapshot Test');
    expect(state.currentStep).toBe(3);
    expect(state.totalSteps).toBe(10);
    expect(state.stepResults).toHaveLength(1);
  });
});

describe('handleWsMessage: unknown type', () => {
  it('leaves state unchanged', () => {
    const before = getStore().status;
    dispatch({ type: 'something_unknown' });
    expect(getStore().status).toBe(before);
  });
});

describe('reset', () => {
  it('restores all fields to initial values', () => {
    dispatch({ type: 'run_started', run_id: 'r1', test_name: 'T', total_steps: 5 });
    dispatch({ type: 'step_completed', step_num: 1, passed: true });
    getStore().reset();
    const state = getStore();
    expect(state.status).toBe('idle');
    expect(state.runId).toBeNull();
    expect(state.testName).toBeNull();
    expect(state.currentStep).toBe(0);
    expect(state.totalSteps).toBe(0);
    expect(state.currentLabel).toBeNull();
    expect(state.stepResults).toEqual([]);
    expect(state.error).toBeNull();
  });
});
