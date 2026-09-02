/**
 * Domain service for Inventory operations.
 */

import {
  deleteInventoryItem as repoDeleteInventoryItem,
  getAllInventory as repoGetAllInventory,
  insertInventoryItem as repoInsertInventoryItem,
  updateInventoryItem as repoUpdateInventoryItem,
} from '../db/inventoryRepository';
import type { InventoryInput, InventoryItem } from '../types/inventory';

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    return repoGetAllInventory();
  },

  async create(input: InventoryInput): Promise<number> {
    return repoInsertInventoryItem(input);
  },

  async update(input: InventoryInput & { id: number }): Promise<void> {
    return repoUpdateInventoryItem(input);
  },

  async remove(id: number): Promise<void> {
    return repoDeleteInventoryItem(id);
  },
};
