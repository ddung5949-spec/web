/**
 * Client-Side Security & Sanitization Utilities
 * - Protects against Cross-Site Scripting (XSS)
 * - Sanitizes user input and safe text rendering
 */

/**
 * Escapes HTML characters in user text inputs to prevent XSS injection
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes rich text / embed code by removing executable script tags and harmful javascript: pseudo-protocols
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
    .replace(/javascript:/gi, 'blocked:');
}

/**
 * Checks if user is authenticated and has required administrative permissions
 */
export function hasAdminPermission(role?: string | null): boolean {
  return role === 'admin';
}

export function hasEditorPermission(role?: string | null): boolean {
  return role === 'admin' || role === 'editor' || role === 'commander';
}
