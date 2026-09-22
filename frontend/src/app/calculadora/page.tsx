'use client';

import MaterialCalculator from '../components/MaterialCalculator';
import { Calculator, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CalculadoraPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </Link>
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calculadora de Materiais</h1>
                <p className="text-gray-600">Calcule a quantidade exata de materiais para seu projeto</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cálculo Preciso</h3>
              <p className="text-sm text-gray-600">
                Algoritmos especializados para cálculos exatos de materiais de construção
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-xl">R$</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Orçamento Real</h3>
              <p className="text-sm text-gray-600">
                Preços atualizados do mercado para um orçamento mais preciso
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-xl">💡</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dicas Profissionais</h3>
              <p className="text-sm text-gray-600">
                Recomendações baseadas na experiência de profissionais da construção
              </p>
            </div>
          </div>

          {/* Calculator */}
          <MaterialCalculator />

          {/* Tips Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Dicas Importantes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">📏 Medições</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Sempre meça duas vezes antes de calcular</li>
                  <li>• Considere irregularidades no terreno</li>
                  <li>• Use instrumentos de medição precisos</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">📦 Materiais</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Adicione 10-15% para perdas e quebras</li>
                  <li>• Verifique a qualidade dos materiais</li>
                  <li>• Compare preços de diferentes fornecedores</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">🏗️ Execução</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Contrate profissionais qualificados</li>
                  <li>• Siga as normas técnicas</li>
                  <li>• Mantenha os materiais protegidos</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">💰 Orçamento</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Reserve 20% para imprevistos</li>
                  <li>• Negocie prazos de pagamento</li>
                  <li>• Considere custos de transporte</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-8 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg shadow-md p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Precisa de Ajuda Especializada?</h2>
            <p className="mb-6 opacity-90">
              Converse com o Zé da Obra 2.0, nosso assistente especializado em materiais de construção
            </p>
            <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Falar com o Zé da Obra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
