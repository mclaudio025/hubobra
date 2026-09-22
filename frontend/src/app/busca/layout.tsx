import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Busca de Produtos',
  description: 'Busque materiais de construção, ferramentas, acabamentos e tintas com entrega rápida.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function BuscaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
