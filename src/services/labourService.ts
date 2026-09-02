/**
 * Domain service for Labour / Staff Profile operations.
 */

import {
  deleteLabourUser as repoDeleteLabourUser,
  getShopLabourList as repoGetShopLabourList,
  updateLabourUser as repoUpdateLabourUser,
} from '../db/profileRepository';
import type { UserProfile } from '../types/profile';

export const labourService = {
  async getShopList(): Promise<UserProfile[]> {
    return repoGetShopLabourList();
  },

  async updateLabour(id: string, name: string, phone: string): Promise<void> {
    return repoUpdateLabourUser(id, name, phone);
  },

  async removeLabour(id: string): Promise<void> {
    return repoDeleteLabourUser(id);
  },
};
