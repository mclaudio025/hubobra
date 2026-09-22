'use client';

import { useState } from 'react';
import { Calculator, Home, Layers, Square, Info } from 'lucide-react';

interface CalculationResult {
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
  }>;
  total_cost: number;
  recommendations: string[];
}

interface ProjectDimensions {
  area?: number;
  length?: number;
  width?: number;
  height?: number;
  thickness?: number;
}

export default function MaterialCalculator() {
  const [projectType, setProjectType] = useState('casa');
  const [dimensions, setDimensions] = useState<ProjectDimensions>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const projectTypes = [
    { value: 'casa', label: 'Casa/Construção', icon: Home },
    { value: 'muro', label: 'Muro/Cerca', icon: Layers },
    { value: 'piso', label: 'Piso/Revestimento', icon: Square },
  ];

  const handleCalculate = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/calculate-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_type: projectType,
          dimensions,
          specifications: {}
        })
      });

      if (!response.ok) {
        throw new Error('Erro no cálculo');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Erro no cálculo:', error);
      alert('Erro ao calcular materiais. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const validateInputs = () => {
    if (projectType === 'casa' && !dimensions.area) {
      alert('Por favor, informe a área da construção');
      return false;
    }
    if (projectType === 'muro' && (!dimensions.length || !dimensions.height)) {
      alert('Por favor, informe o comprimento e altura do muro');
      return false;
    }
    if (projectType === 'piso' && !dimensions.area) {
      alert('Por favor, informe a área do piso');
      return false;
    }
    return true;
  };

  const renderDimensionInputs = () => {
    switch (projectType) {
      case 'casa':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área da Construção (m²)
              </label>
              <input
                type="number"
                value={dimensions.area || ''}
                onChange={(e) => setDimensions({ ...dimensions, area: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: 100"
              />
            </div>
          </div>
        );

      case 'muro':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprimento (m)
                </label>
                <input
                  type="number"
                  value={dimensions.length || ''}
                  onChange={(e) => setDimensions({ ...dimensions, length: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Altura (m)
                </label>
                <input
                  type="number"
                  value={dimensions.height || ''}
                  onChange={(e) => setDimensions({ ...dimensions, height: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 2"
                />
              </div>
            </div>
          </div>
        );

      case 'piso':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprimento (m)
                </label>
                <input
                  type="number"
                  value={dimensions.length || ''}
                  onChange={(e) => {
                    const length = parseFloat(e.target.value) || 0;
                    const width = dimensions.width || 0;
                    setDimensions({ 
                      ...dimensions, 
                      length,
                      area: length * width
                    });
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Largura (m)
                </label>
                <input
                  type="number"
                  value={dimensions.width || ''}
                  onChange={(e) => {
                    const width = parseFloat(e.target.value) || 0;
                    const length = dimensions.length || 0;
                    setDimensions({ 
                      ...dimensions, 
                      width,
                      area: length * width
                    });
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 8"
                />
              </div>
            </div>
            {dimensions.length && dimensions.width && (
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-800">
                  Área total: {(dimensions.length * dimensions.width).toFixed(2)} m²
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-6 w-6 text-orange-600" />
        <h2 className="text-xl font-semibold">Calculadora de Materiais</h2>
      </div>

      {/* Project Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de Projeto
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {projectTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => {
                  setProjectType(type.value);
                  setDimensions({});
                  setResult(null);
                }}
                className={`flex items-center gap-3 p-4 border rounded-lg transition ${
                  projectType === type.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dimension Inputs */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Dimensões
        </label>
        {renderDimensionInputs()}
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        disabled={loading}
        className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Calculator className="h-4 w-4" />
        {loading ? 'Calculando...' : 'Calcular Materiais'}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Lista de Materiais</h3>
            <div className="space-y-3">
              {result.materials.map((material, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{material.name}</p>
                    <p className="text-sm text-gray-600">
                      {material.quantity} {material.unit} × R$ {material.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      R$ {material.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-orange-900">Total Estimado:</span>
              <span className="text-2xl font-bold text-orange-900">
                R$ {result.total_cost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Recomendações:</h4>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-800">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition">
              Adicionar ao Carrinho
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition">
              Salvar Orçamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
