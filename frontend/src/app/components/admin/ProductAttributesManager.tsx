'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Save, ChevronDown } from 'lucide-react';
import { useToast } from '../ui/Toaster';

interface AttributeOption {
  id: string;
  value: string;
  label?: string;
  color?: string;
  order: number;
  active: boolean;
}

interface Attribute {
  id: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'BOOLEAN' | 'COLOR';
  required: boolean;
  order: number;
  active: boolean;
  options: AttributeOption[];
}

interface ProductAttribute {
  id?: string;
  attributeId: string;
  optionId?: string;
  value?: string;
  attribute?: Attribute;
  option?: AttributeOption;
}

interface ProductAttributesManagerProps {
  productAttributes: ProductAttribute[];
  onChange: (attributes: ProductAttribute[]) => void;
  disabled?: boolean;
}

export default function ProductAttributesManager({
  productAttributes,
  onChange,
  disabled = false
}: ProductAttributesManagerProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<string>('');
  
  const { addToast } = useToast();

  useEffect(() => {
    loadAttributes();
  }, []);

  const loadAttributes = async () => {
    try {
      setLoading(true);
      
      // Mock data - substituir pela chamada real da API
      const mockAttributes: Attribute[] = [
        {
          id: '1',
          name: 'Cor',
          type: 'COLOR',
          required: false,
          order: 1,
          active: true,
          options: [
            { id: '1-1', value: 'Branco', color: '#FFFFFF', order: 1, active: true },
            { id: '1-2', value: 'Cinza', color: '#808080', order: 2, active: true },
            { id: '1-3', value: 'Preto', color: '#000000', order: 3, active: true },
          ]
        },
        {
          id: '2',
          name: 'Tamanho',
          type: 'SELECT',
          required: false,
          order: 2,
          active: true,
          options: [
            { id: '2-1', value: 'P', label: 'Pequeno', order: 1, active: true },
            { id: '2-2', value: 'M', label: 'Médio', order: 2, active: true },
            { id: '2-3', value: 'G', label: 'Grande', order: 3, active: true },
            { id: '2-4', value: 'GG', label: 'Extra Grande', order: 4, active: true },
          ]
        },
        {
          id: '3',
          name: 'Material',
          type: 'SELECT',
          required: false,
          order: 3,
          active: true,
          options: [
            { id: '3-1', value: 'Cerâmica', order: 1, active: true },
            { id: '3-2', value: 'Concreto', order: 2, active: true },
            { id: '3-3', value: 'Metal', order: 3, active: true },
            { id: '3-4', value: 'Madeira', order: 4, active: true },
          ]
        },
        {
          id: '4',
          name: 'Resistência',
          type: 'TEXT',
          required: false,
          order: 4,
          active: true,
          options: []
        },
        {
          id: '5',
          name: 'Peso (kg)',
          type: 'NUMBER',
          required: false,
          order: 5,
          active: true,
          options: []
        },
        {
          id: '6',
          name: 'À prova d\'água',
          type: 'BOOLEAN',
          required: false,
          order: 6,
          active: true,
          options: []
        }
      ];

      setAttributes(mockAttributes);
    } catch (error) {
      console.error('Erro ao carregar atributos:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível carregar os atributos'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttribute = () => {
    if (!selectedAttribute) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Selecione um atributo'
      });
      return;
    }

    const attribute = attributes.find(a => a.id === selectedAttribute);
    if (!attribute) return;

    // Verificar se já existe
    const exists = productAttributes.find(pa => pa.attributeId === selectedAttribute);
    if (exists) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Este atributo já foi adicionado'
      });
      return;
    }

    const newAttribute: ProductAttribute = {
      attributeId: selectedAttribute,
      attribute: attribute,
      ...(attribute.type === 'SELECT' || attribute.type === 'COLOR' ? {} : { value: '' })
    };

    onChange([...productAttributes, newAttribute]);
    setSelectedAttribute('');
    setShowAddForm(false);
  };

  const handleUpdateAttribute = (index: number, field: 'optionId' | 'value', value: string) => {
    const updated = [...productAttributes];
    const attr = updated[index];
    
    if (field === 'optionId') {
      attr.optionId = value;
      attr.option = attr.attribute?.options.find(o => o.id === value);
      delete attr.value;
    } else {
      attr.value = value;
      delete attr.optionId;
      delete attr.option;
    }
    
    onChange(updated);
  };

  const handleRemoveAttribute = (index: number) => {
    const updated = productAttributes.filter((_, i) => i !== index);
    onChange(updated);
  };

  const renderAttributeInput = (productAttr: ProductAttribute, index: number) => {
    const { attribute } = productAttr;
    if (!attribute) return null;

    switch (attribute.type) {
      case 'SELECT':
        return (
          <select
            value={productAttr.optionId || ''}
            onChange={(e) => handleUpdateAttribute(index, 'optionId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          >
            <option value="">Selecione uma opção</option>
            {attribute.options.filter(o => o.active).map(option => (
              <option key={option.id} value={option.id}>
                {option.label || option.value}
              </option>
            ))}
          </select>
        );

      case 'COLOR':
        return (
          <div className="flex flex-wrap gap-2">
            {attribute.options.filter(o => o.active).map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleUpdateAttribute(index, 'optionId', option.id)}
                className={`w-8 h-8 rounded border-2 transition ${
                  productAttr.optionId === option.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: option.color }}
                title={option.value}
                disabled={disabled}
              />
            ))}
          </div>
        );

      case 'TEXT':
        return (
          <input
            type="text"
            value={productAttr.value || ''}
            onChange={(e) => handleUpdateAttribute(index, 'value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Digite o valor para ${attribute.name}`}
            disabled={disabled}
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            value={productAttr.value || ''}
            onChange={(e) => handleUpdateAttribute(index, 'value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Digite o valor para ${attribute.name}`}
            disabled={disabled}
          />
        );

      case 'BOOLEAN':
        return (
          <select
            value={productAttr.value || ''}
            onChange={(e) => handleUpdateAttribute(index, 'value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          >
            <option value="">Selecione</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Atributos do Produto</h3>
        {!disabled && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Adicionar Atributo
          </button>
        )}
      </div>

      {/* Add Attribute Form */}
      {showAddForm && !disabled && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <select
              value={selectedAttribute}
              onChange={(e) => setSelectedAttribute(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um atributo</option>
              {attributes
                .filter(attr => attr.active && !productAttributes.find(pa => pa.attributeId === attr.id))
                .map(attr => (
                  <option key={attr.id} value={attr.id}>
                    {attr.name} ({attr.type})
                  </option>
                ))}
            </select>
            
            <button
              type="button"
              onClick={handleAddAttribute}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              <Save className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setSelectedAttribute('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Attributes List */}
      <div className="space-y-3">
        {productAttributes.map((productAttr, index) => (
          <div key={`${productAttr.attributeId}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {productAttr.attribute?.name}
                  {productAttr.attribute?.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderAttributeInput(productAttr, index)}
              </div>
              
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveAttribute(index)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                  title="Remover atributo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {productAttributes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum atributo adicionado</p>
          <p className="text-sm">Clique em "Adicionar Atributo" para começar</p>
        </div>
      )}
    </div>
  );
}
