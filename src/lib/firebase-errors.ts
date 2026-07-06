import { FirebaseError } from "firebase/app";

// Turns a Firebase error into a short, friendly message for the UI.
export function friendlyAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Try signing in instead.";
      case "auth/invalid-email":
        return "That email address doesn't look right.";
      case "auth/weak-password":
        return "Password is too weak — use at least 6 characters.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return err.message.replace("Firebase: ", "");
    }
  }
  return "Something went wrong. Please try again.";
}
