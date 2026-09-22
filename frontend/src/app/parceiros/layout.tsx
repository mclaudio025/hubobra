import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seja uma Loja Parceira',
  description: 'Cadastre sua loja de materiais de construção no HubConstruções e venda para milhares de construtores, arquitetos e clientes finais da sua região.',
  alternates: {
    canonical: '/parceiros',
  },
  openGraph: {
    title: 'Seja uma Loja Parceira | HubConstruções',
    description: 'Aumente as vendas do seu depósito de construção com a maior rede integrada da região.',
    url: '/parceiros',
  },
};

export default function ParceirosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
