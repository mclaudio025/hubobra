import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calculadora de Materiais de Construção',
  description: 'Calcule a quantidade exata de cimento, tijolos, argamassa, tinta e pisos para o seu projeto de construção ou reforma.',
  alternates: {
    canonical: '/calculadora',
  },
  openGraph: {
    title: 'Calculadora de Materiais | HubConstruções',
    description: 'Evite desperdícios na sua obra. Calcule cimento, tijolo, areia e tinta em segundos.',
    url: '/calculadora',
  },
};

export default function CalculadoraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
