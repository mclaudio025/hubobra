import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planejador 3D de Ambientes & Obra',
  description: 'Simulador 3D interativo para planejar seu ambiente e calcular materiais com visualização em tempo real.',
  alternates: {
    canonical: '/builder3d',
  },
  openGraph: {
    title: 'Simulador 3D de Ambientes | HubConstruções',
    description: 'Planeje seu espaço em 3D e veja os materiais necessários para sua obra.',
    url: '/builder3d',
  },
};

export default function Builder3DLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
