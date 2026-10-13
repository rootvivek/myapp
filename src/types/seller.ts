/** Seller entity — represents a supplier/vendor from whom parts are purchased. */
export interface Seller {
  id: number;
  sellerName: string;
  phone: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a new seller (id, timestamps, createdBy are server-side). */
export type SellerInput = {
  sellerName: string;
  phone?: string;
};
