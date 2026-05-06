/** One row per phone — latest job used for name/device when reusing a customer. */
export type DirectoryCustomer = {
  phone: string;
  customerName: string;
  deviceModel: string;
};
