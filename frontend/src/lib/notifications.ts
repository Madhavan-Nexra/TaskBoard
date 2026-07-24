// Thin wrapper around the browser's native Notification API — the actual
// OS-level popup (like WhatsApp desktop alerts), distinct from the in-app toast.

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

/** Must be called from a user gesture (e.g. a button click) — browsers ignore
 * or silently ignore permission requests fired on page load. */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.requestPermission()
}

export function showNativeNotification(title: string, body: string, tag: string) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  new Notification(title, { body, tag, icon: '/favicon.svg' })
}
