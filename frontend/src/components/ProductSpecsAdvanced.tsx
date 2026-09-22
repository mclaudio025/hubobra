'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, 
  Ruler, 
  Weight, 
  Shield, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  HardHat, 
  FileText, 
  Layers, 
  Flame, 
  Droplets, 
  Zap, 
  Wrench,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useProducts } from '../app/hooks/useApi';
import { useToast } from '@/app/components/ui/Toaster';

interface SpecItem {
  id?: string;
  category: string;
  label: string;
  value: string;
  unit?: string;
  importance?: 'high' | 'medium' | 'low';
  description?: string;
}

interface SpecCategory {
  name: string;
  items: SpecItem[];
}

interface ProductSpecsAdvancedProps {
  product: {
    id: string;
    name: string;
    description?: string;
    specifications?: string;
    brand?: string;
    sku?: string;
    barcode?: string;
    dimensions?: string;
    weight?: number;
    warranty?: string;
    origin?: string;
    category?: {
      id?: string;
      name?: string;
      slug?: string;
    };
  };
  onSpecsUpdated?: (updatedProduct: any) => void;
  className?: string;
}

export default function ProductSpecsAdvanced({
  product,
  onSpecsUpdated,
  className = ''
}: ProductSpecsAdvancedProps) {
  const [enriching, setEnriching] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({});

  const { autoEnrichSpecs } = useProducts();
  const { addToast } = useToast();

  // Parse das especificações salvas ou geração dinâmica caso vazio
  const parseSpecifications = (): { summary: string; categories: SpecCategory[] } => {
    if (product.specifications) {
      try {
        const parsed = JSON.parse(product.specifications);
        if (parsed.categories && Array.isArray(parsed.categories)) {
          return parsed;
        }
      } catch (e) {
        // Se for string de texto simples (ex: Chave: Valor)
        const lines = product.specifications.split('\n').filter(l => l.trim().length > 0);
        const parsedItems: SpecItem[] = lines.map((line, idx) => {
          const parts = line.split(':');
          return {
            id: `spec-${idx}`,
            category: 'Geral',
            label: parts[0]?.trim() || 'Especificação',
            value: parts.slice(1).join(':')?.trim() || '-',
            importance: 'medium'
          };
        });

        return {
          summary: product.description || 'Especificações técnicas fornecidas pelo fabricante.',
          categories: [{ name: 'Geral', items: parsedItems }]
        };
      }
    }

    // Fallback inteligente baseado nos atributos do produto
    const defaultCategories: SpecCategory[] = [
      {
        name: 'Identificação e Marca',
        items: [
          { category: 'Identificação', label: 'Marca / Fabricante', value: product.brand || 'Parceiro HubConstruções', importance: 'high' },
          { category: 'Identificação', label: 'Código SKU', value: product.sku || 'N/A', importance: 'medium' },
          ...(product.barcode ? [{ category: 'Identificação', label: 'Código de Barras (EAN-13)', value: product.barcode, importance: 'high' as const }] : []),
          { category: 'Identificação', label: 'Origem', value: product.origin || 'Nacional', importance: 'low' }
        ]
      },
      {
        name: 'Dimensões e Embalagem',
        items: [
          { category: 'Dimensões', label: 'Dimensões / Medidas', value: product.dimensions || 'Consulte Ficha Técnica', importance: 'high' },
          { category: 'Dimensões', label: 'Peso Aproximado', value: product.weight && product.weight > 0 ? `${product.weight} kg` : 'Padrão da Categoria', importance: 'medium' }
        ]
      },
      {
        name: 'Garantia e Normas',
        items: [
          { category: 'Garantia', label: 'Garantia de Fábrica', value: product.warranty || '12 meses contra defeitos de fabricação', importance: 'high' },
          { category: 'Garantia', label: 'Certificação Técnica', value: 'Conforme Normas ABNT NBR Vigentes', importance: 'high' }
        ]
      }
    ];

    return {
      summary: product.description || 'Ficha técnica inicial gerada para o produto.',
      categories: defaultCategories
    };
  };

  const specsData = parseSpecifications();

  const handleAutoEnrich = async () => {
    try {
      setEnriching(true);
      const result = await autoEnrichSpecs(product.id);
      
      addToast({
        type: 'success',
        title: 'Especificações Preenchidas via Web!',
        message: 'A ficha técnica e normas ABNT foram atualizadas com sucesso com dados oficiais do fabricante.'
      });

      if (onSpecsUpdated && result?.product) {
        onSpecsUpdated(result.product);
      } else {
        // Recarregar estado
        window.location.reload();
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro no auto-preenchimento',
        message: error.message || 'Não foi possível buscar na web neste momento.'
      });
    } finally {
      setEnriching(false);
    }
  };

  const handleCopyValue = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleCategory = (catName: string) => {
    setExpandedSection(prev => ({
      ...prev,
      [catName]: prev[catName] === false ? true : false
    }));
  };

  const getCategoryIcon = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('dimens') || lower.includes('medida')) return Ruler;
    if (lower.includes('material') || lower.includes('estrutura')) return Layers;
    if (lower.includes('desempenho') || lower.includes('aplica')) return HardHat;
    if (lower.includes('norma') || lower.includes('garantia')) return Award;
    if (lower.includes('identifica') || lower.includes('marca')) return FileText;
    return Info;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Banner / Card de Sincronização e Inteligência Web */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-5 md:p-6 rounded-2xl border border-orange-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-orange-600 text-white rounded-xl shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 text-sm md:text-base">
                Ficha Técnica Inteligente & Normas ABNT
              </h4>
              <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Verificado Hub
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 max-w-xl">
              Dados técnicos padronizados de diâmetro, material, normas ABNT NBR e pressão de serviço para compras seguras na construção civil.
            </p>
          </div>
        </div>

        <button
          onClick={handleAutoEnrich}
          disabled={enriching}
          className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl shadow transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-60 flex-shrink-0"
        >
          {enriching ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Buscando na Web...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Sincronizar Ficha via Web</span>
            </>
          )}
        </button>
      </div>

      {/* Grid de Categorias de Especificações Técnicas */}
      <div className="space-y-4">
        {specsData.categories.map((category, catIdx) => {
          const IconComp = getCategoryIcon(category.name);
          const isCollapsed = expandedSection[category.name] === true;

          return (
            <div
              key={catIdx}
              className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-sm"
            >
              {/* Header da Categoria */}
              <div
                onClick={() => toggleCategory(category.name)}
                className="w-full px-5 py-3.5 bg-slate-50/70 border-b border-gray-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white text-orange-600 rounded-lg shadow-2xs border border-gray-200/60">
                    <IconComp className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{category.name}</h4>
                  <span className="text-[11px] text-gray-400 font-medium">
                    ({category.items.length} {category.items.length === 1 ? 'item' : 'itens'})
                  </span>
                </div>

                <div className="text-gray-400">
                  {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              </div>

              {/* Tabela de Itens */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-100">
                  {category.items.map((item, itemIdx) => {
                    const uniqueKey = `${catIdx}-${itemIdx}`;
                    const isCopied = copiedKey === uniqueKey;

                    return (
                      <div
                        key={itemIdx}
                        className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-orange-50/20 transition-colors"
                      >
                        <div className="sm:w-1/3 flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700">
                            {item.label}
                          </span>
                          {item.importance === 'high' && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded border border-amber-200">
                              Principal
                            </span>
                          )}
                        </div>

                        <div className="sm:w-2/3 flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <span className="text-xs font-bold text-gray-900 leading-relaxed">
                              {item.value} {item.unit && <span className="text-gray-500 font-normal">{item.unit}</span>}
                            </span>
                            {item.description && (
                              <p className="text-[11px] text-gray-500 mt-0.5">{item.description}</p>
                            )}
                          </div>

                          <button
                            onClick={() => handleCopyValue(uniqueKey, `${item.label}: ${item.value}`)}
                            title="Copiar valor"
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dicas e Informações Técnicas para o Instalador */}
      <div className="p-4.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Recomendação Técnica de Instalação:</span> Certifique-se de que a instalação seja realizada conforme as instruções do fabricante e normas ABNT vigentes. Para conexões soldáveis, utilize adesivo plástico e solução limpadora apropriados.
        </div>
      </div>
    </div>
  );
}