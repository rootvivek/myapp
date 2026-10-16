/**
 * Private Master Admin credential checked on the login screen before the
 * Master Admin Panel opens, and sent as `x-master-key` to the trusted
 * backend admin routes (which validate it against MASTER_ADMIN_KEY).
 *
 * Override both sides in production: set MASTER_ADMIN_KEY in backend/.env
 * and mirror the value here before shipping.
 */
export const MASTER_ADMIN_USERS = ['masteradmin', 'admin@mca.internal'] as const;
export const MASTER_ADMIN_KEY = 'MasterAdminSecureKey@2026';

export function isMasterAdminLogin(identifier: string, key: string): boolean {
  const id = identifier.trim().toLowerCase();
  return (MASTER_ADMIN_USERS as readonly string[]).includes(id) && key === MASTER_ADMIN_KEY;
}
