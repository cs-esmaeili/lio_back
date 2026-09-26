/**
 * Permission required to open the admin dashboard panel.
 * Used both by the seeder and by the auth responses (`showAdminPanel`).
 */
export const ADMIN_PANEL_VIEW_PERMISSION = 'admin:panel:view';

/**
 * Default role assigned to newly registered users.
 * Seeded with no permissions; used by the seeder and by user creation.
 */
export const DEFAULT_USER_ROLE_NAME = 'user';
