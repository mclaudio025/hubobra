'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PerfilPage from '../perfil/page';

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/perfil');
  }, [router]);

  return <PerfilPage />;
}