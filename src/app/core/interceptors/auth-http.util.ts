export function isAuthBypassUrl(url: string): boolean {
  return url.includes('/auth/login')
    || url.includes('/auth/refresh')
    || url.includes('/auth/forgot-password')
    || url.includes('/auth/reset-password');
}
