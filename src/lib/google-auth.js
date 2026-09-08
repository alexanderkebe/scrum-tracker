'use client';

export async function startGoogleSignIn() {
  const response = await fetch('/api/auth/google/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  if (!response.ok || !data.url) {
    throw new Error(data.error || 'Could not start Google sign-in. Please try again.');
  }
  window.location.assign(data.url);
}
