export type UserRole = 'owner' | 'labour';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  shopId: string;
  shopName?: string;
}
