import Link from 'next/link';
import { Menu } from 'lucide-react';

export default function DepartmentMenu() {
  return (
    <div className="bg-background border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center py-2">
        <button className="flex items-center gap-2 font-bold text-primary">
          <Menu />
          <span>Todos os Departamentos</span>
        </button>
        <nav className="flex gap-6">
          <Link href="/reforme-e-renove" className="hover:text-primary">Reforme e Renove</Link>
          <Link href="/pisos-e-revestimentos" className="hover:text-primary">Pisos e Revestimentos</Link>
          <Link href="/banheiro" className="hover:text-primary">Banheiro</Link>
          <Link href="/tintas" className="hover:text-primary">Tintas</Link>
        </nav>
        <button className="bg-primary text-white px-4 py-2 rounded-md font-bold">Encarte Digital</button>
      </div>
    </div>
  );
}
