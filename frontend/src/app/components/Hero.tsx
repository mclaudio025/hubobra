'use client';

import { ArrowRight, Zap, Target, Package, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
    return (
        <div className="relative bg-gray-900 text-white overflow-hidden py-16 md:py-24">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Main content */}
                    <div className="flex flex-col items-start gap-6 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-600/20 border border-orange-500/30 text-orange-400 text-sm font-semibold">
                            <Zap size={16} />
                            <span>Oferta da Semana: 40% OFF</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight">
                            A nova tecnologia chegou na <span className="text-orange-500">Modernidade</span>.
                        </h1>

                        <p className="text-lg text-gray-300 leading-relaxed font-light">
                            Descubra nossa linha exclusiva de eletrônicos, casa inteligente e
                            gadgets que vão transformar sua rotina com qualidade premium e frete grátis.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2">
                            <button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-600/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                                Descobrir Produtos
                                <ArrowRight size={20} />
                            </button>
                            <button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center">
                                Ver Categorias
                            </button>
                        </div>

                        {/* Micro Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-800 w-full">
                            <div>
                                <h4 className="text-2xl font-black text-white mb-1">+15k</h4>
                                <p className="text-sm text-gray-400">Clientes Ativos</p>
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-white mb-1">4.9/5</h4>
                                <p className="text-sm text-gray-400">Avaliação Média</p>
                            </div>
                        </div>
                    </div>

                    {/* Hero Banner Image Area (Placeholder) */}
                    <div className="hidden lg:block relative">
                        <div className="relative w-full aspect-square max-w-md mx-auto">
                            {/* Floating Cards Demo */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-orange-600 to-yellow-500 rounded-3xl transform rotate-3 scale-105 opacity-20" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-gray-800 to-gray-700 rounded-3xl border border-gray-600 shadow-2xl overflow-hidden flex flex-col justify-end p-8">
                                <div className="w-full h-full bg-orange-500/10 rounded-xl mb-6 flex items-center justify-center border border-orange-500/20">
                                    <Target className="w-24 h-24 text-orange-500 opacity-50" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Smartwatch Pro X</h3>
                                <p className="text-gray-400 mb-4 line-clamp-2 text-sm">Monitoramento cardíaco em tempo real, GPS integrado e bateria para 15 dias.</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="block text-sm text-gray-400 line-through">R$ 1.299,00</span>
                                        <span className="block text-2xl font-bold text-orange-500">R$ 899,00</span>
                                    </div>
                                    <button className="h-12 px-6 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                                        Comprar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
