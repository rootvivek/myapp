import {
  getBuySellRecords as repoGetBuySellRecords,
  insertBuySellRecord as repoInsertBuySellRecord,
} from '../db/buySellRepository';
import type { BuySellRecord, BuySellInput } from '../types/buySell';

export const buySellService = {
  async getRecords(): Promise<BuySellRecord[]> {
    return repoGetBuySellRecords();
  },
  async saveRecord(input: BuySellInput): Promise<BuySellRecord> {
    return repoInsertBuySellRecord(input);
  },
};
