import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Sign In', template: '%s · Scholr' },
  description: 'Sign in or create your free Scholr account — AI-powered attendance tracking for college students.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
