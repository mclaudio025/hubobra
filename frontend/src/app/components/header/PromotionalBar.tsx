import Link from 'next/link';

export default function PromotionalBar() {
  return (
    <div className="bg-accent">
      <div className="container mx-auto flex justify-center items-center py-2 gap-12">
        <Link href="/ofertas" className="text-primary font-bold hover:underline">OFERTAS</Link>
        <Link href="/mais-vendidos" className="text-primary font-bold hover:underline">MAIS VENDIDOS</Link>
        <Link href="/exclusivos" className="text-primary font-bold hover:underline">EXCLUSIVOS</Link>
      </div>
    </div>
  );
}
