const MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account already exists for that email — try logging in instead.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/too-many-requests': 'Too many attempts — please wait a moment and try again.',
  'auth/network-request-failed': 'Network error — check your connection and try again.',
};

export function authErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (MESSAGES[code]) return MESSAGES[code];
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
