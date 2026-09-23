export type UserRole = 'owner' | 'labour' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  phone: string;
  shopLogoUrl?: string;
  role: UserRole;
  shopId: string;
  shopName?: string;
}
