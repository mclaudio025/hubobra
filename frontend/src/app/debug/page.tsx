'use client';

import { motion } from 'framer-motion';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Header simples */}
      <header className="bg-white shadow-lg p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">Loja Moderna - Debug</h1>
        </div>
      </header>

      {/* Hero simples */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            <h1 className="text-5xl font-bold mb-6">Bem-vindo à Loja Moderna</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Sua plataforma de e-commerce para materiais de construção sustentáveis
            </p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
              Explorar Produtos
            </button>
          </motion.div>
        </div>
      </section>

      {/* Seção de produtos simples */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Produtos em Destaque</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: item * 0.1 }}
                className="bg-gray-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="bg-gray-300 h-48 rounded mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">Produto {item}</h3>
                <p className="text-gray-600 mb-4">Descrição do produto {item}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-orange-500">R$ 99,90</span>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
                    Comprar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer simples */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Loja Moderna. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}