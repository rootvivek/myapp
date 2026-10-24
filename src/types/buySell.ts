export type BuySellType = 'buy' | 'sell';

export interface BuySellRecord {
  id: number;
  orderCode: string;
  type: BuySellType;
  customerName: string;
  phone: string;
  deviceModel: string;
  imei: string;
  price: number;
  notes: string;
  date: string;
  deviceImage: string;
  idProofImage: string;
  createdAt: string;
  updatedAt: string;
}

export type BuySellInput = Omit<BuySellRecord, 'id' | 'createdAt' | 'updatedAt' | 'orderCode'> & {
  id?: number;
  orderCode?: string;
};

