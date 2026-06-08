export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  stockCount: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryInput = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: number;
};
