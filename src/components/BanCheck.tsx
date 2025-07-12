'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BanCheckProps {
  children: React.ReactNode;
}

export default function BanCheck({ children }: BanCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkBanStatus = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/check-ban');
          if (response.ok) {
            const data = await response.json();
            if (data.isBanned) {
              router.push('/banned');
            }
          }
        } catch (error) {
          console.error('Error checking ban status:', error);
        }
      }
    };

    if (status === 'authenticated') {
      checkBanStatus();
    }
  }, [session, status, router]);

  return <>{children}</>;
} 