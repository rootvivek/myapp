import { useCallback, useReducer } from 'react';
import type { LockType, RepairImageSlot, RepairStatus } from '../../../types/repair';
import { initialRepairFormState, repairFormReducer } from '../reducer';
import type { RepairFormState, WarrantyType } from '../types';

export function useRepairForm(initialState?: Partial<RepairFormState>) {
  const [state, dispatch] = useReducer(
    repairFormReducer,
    initialState ? { ...initialRepairFormState, ...initialState } : initialRepairFormState
  );

  const setField = useCallback(<K extends keyof RepairFormState>(field: K, value: RepairFormState[K]) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const setAccessory = useCallback((key: 'accSimTray' | 'accBackCover', value: boolean) => {
    dispatch({ type: 'SET_ACCESSORY', key, value });
  }, []);

  const setImageSlot = useCallback((slot: RepairImageSlot, uri: string) => {
    dispatch({ type: 'SET_IMAGE', slot, uri });
  }, []);

  const setFormData = useCallback((payload: Partial<RepairFormState>) => {
    dispatch({ type: 'SET_FORM_DATA', payload });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    setField,
    setAccessory,
    setImageSlot,
    setFormData,
    reset,
  };
}
