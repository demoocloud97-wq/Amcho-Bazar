// Emails listed here get admin access (Admin dashboard, Live Draw, Categories,
// Stall management). Add/remove emails as needed. Case-insensitive.
//
// NOTE: this is a client-side allowlist — good enough to control what the UI
// shows. For real backend enforcement, set a Firebase custom claim `admin: true`
// on these users and the Firestore/Storage rules already honour it.
export const ADMIN_EMAILS: string[] = [
  "alfajaryouthwing@gmail.com",
  "demoocloud97@gmail.com",
  "admin@amchobazar.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}
