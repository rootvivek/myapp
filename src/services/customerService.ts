/**
 * Domain service for Customer Directory operations.
 */

import { getDirectoryCustomers as repoGetDirectoryCustomers } from '../db/customerRepository';
import type { DirectoryCustomer } from '../types/customer';

export const customerService = {
  async getDirectory(limit = 300): Promise<DirectoryCustomer[]> {
    return repoGetDirectoryCustomers(limit);
  },
};
