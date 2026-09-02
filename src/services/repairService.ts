/**
 * Domain service for Repair operations.
 * Encapsulates business rules, formatting, and delegates data access to repairRepository.
 */

import {
  deleteRepair as repoDeleteRepair,
  getAllRepairs as repoGetAllRepairs,
  getPaginatedRepairs as repoGetPaginatedRepairs,
  getRepairById as repoGetRepairById,
  insertRepair as repoInsertRepair,
  searchRepairs as repoSearchRepairs,
  updateRepair as repoUpdateRepair,
  updateRepairStatus as repoUpdateRepairStatus,
} from '../db/repairRepository';
import type { Repair, RepairInput, RepairStatus } from '../types/repair';

export const repairService = {
  async getAll(): Promise<Repair[]> {
    return repoGetAllRepairs();
  },

  async getPaginated(page = 1, limit = 50): Promise<{ data: Repair[]; hasMore: boolean }> {
    return repoGetPaginatedRepairs(page, limit);
  },

  async getById(id: number): Promise<Repair | null> {
    return repoGetRepairById(id);
  },

  async search(query: string): Promise<Repair[]> {
    return repoSearchRepairs(query);
  },

  async create(input: RepairInput): Promise<number> {
    return repoInsertRepair(input);
  },

  async update(input: RepairInput & { id: number }): Promise<void> {
    return repoUpdateRepair(input);
  },

  async updateStatus(
    id: number,
    status: RepairStatus,
    paymentUpdate?: { isPaid: boolean; paymentType?: 'cash' | 'online' }
  ): Promise<void> {
    return repoUpdateRepairStatus(id, status, paymentUpdate);
  },

  async remove(id: number): Promise<void> {
    return repoDeleteRepair(id);
  },
};
