import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/sidebar';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');
  return (
    <div className="min-h-screen">
      <Sidebar user={session.user as any} />
      <div className="lg:pl-64 pt-[60px] lg:pt-0 min-h-screen">
        {children}
      </div>
    </div>
  );
}
