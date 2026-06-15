export type UserRole = 'owner' | 'labour';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  phone: string;
  role: UserRole;
  shopId: string;
  shopName?: string;
}
