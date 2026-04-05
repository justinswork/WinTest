import { create } from 'zustand';
import type { Step } from '../api/types';

interface StepClipboardState {
  copiedStep: Step | null;
  copy: (step: Step) => void;
}

export const useStepClipboard = create<StepClipboardState>((set) => ({
  copiedStep: null,
  copy: (step) => set({ copiedStep: { ...step } }),
}));
