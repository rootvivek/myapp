/**
 * Domain service for Seller operations.
 * Thin service layer — delegates data access to sellerRepository,
 * matching the pattern of customerService.ts / repairService.ts.
 */

import {
  getAllSellers as repoGetAllSellers,
  insertSeller as repoInsertSeller,
} from '../db/sellerRepository';
import type { Seller, SellerInput } from '../types/seller';

export const sellerService = {
  async getAll(): Promise<Seller[]> {
    return repoGetAllSellers();
  },

  async create(input: SellerInput): Promise<Seller> {
    return repoInsertSeller(input);
  },
};
