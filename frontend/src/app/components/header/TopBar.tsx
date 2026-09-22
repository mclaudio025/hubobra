import Link from 'next/link';

export default function TopBar() {
  return (
    <div className="bg-secondary-dark text-background text-sm py-1">
      <div className="container mx-auto flex justify-between items-center">
        <p>RETIRE EM LOJA EM ATÉ 1 HORA</p>
        <div className="flex gap-4">
          <Link href="/meus-pedidos" className="hover:underline">Meus Pedidos</Link>
          <Link href="/fale-conosco" className="hover:underline">Fale Conosco</Link>
        </div>
      </div>
    </div>
  );
}
