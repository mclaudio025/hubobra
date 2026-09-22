'use client';

import { useState } from 'react';
import { Plus, Trash2, Copy, Download, Upload } from 'lucide-react';

interface Product {
  id?: string;
  name: string;
  price: number;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  specifications: string;
  stock: number;
  sku: string;
  barcode: string;
  weight: number;
  dimensions: string;
  images: string[];
  tags: string[];
  active: boolean;
}

const defaultProduct: Product = {
  name: '',
  price: 0,
  category: '',
  subcategory: '',
  brand: '',
  description: '',
  specifications: '',
  stock: 0,
  sku: '',
  barcode: '',
  weight: 0,
  dimensions: '',
  images: [''],
  tags: [],
  active: true
};

const categories = [
  'Cimento e Argamassa',
  'Tijolos e Blocos',
  'Telhas e Coberturas',
  'Pisos e Revestimentos',
  'Tintas e Vernizes',
  'Ferragens',
  'Elétrica',
  'Hidráulica',
  'Madeiras',
  'Ferramentas'
];

export default function CadastroMassa() {
  const [products, setProducts] = useState<Product[]>([{ ...defaultProduct }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const addProduct = () => {
    setProducts([...products, { ...defaultProduct }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const duplicateProduct = (index: number) => {
    const productToDuplicate = { ...products[index] };
    productToDuplicate.sku = productToDuplicate.sku + '_copy';
    setProducts([...products.slice(0, index + 1), productToDuplicate, ...products.slice(index + 1)]);
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const updateProductImage = (productIndex: number, imageIndex: number, value: string) => {
    const updated = [...products];
    updated[productIndex].images[imageIndex] = value;
    setProducts(updated);
  };

  const addImageField = (productIndex: number) => {
    const updated = [...products];
    updated[productIndex].images.push('');
    setProducts(updated);
  };

  const removeImageField = (productIndex: number, imageIndex: number) => {
    const updated = [...products];
    if (updated[productIndex].images.length > 1) {
      updated[productIndex].images.splice(imageIndex, 1);
    }
    setProducts(updated);
  };

  const handleTagsChange = (index: number, tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    updateProduct(index, 'tags', tags);
  };

  const validateProducts = () => {
    const errors: string[] = [];
    products.forEach((product, index) => {
      if (!product.name) errors.push(`Produto ${index + 1}: Nome é obrigatório`);
      if (!product.price || product.price <= 0) errors.push(`Produto ${index + 1}: Preço deve ser maior que zero`);
      if (!product.category) errors.push(`Produto ${index + 1}: Categoria é obrigatória`);
      if (!product.sku) errors.push(`Produto ${index + 1}: SKU é obrigatório`);
    });
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const errors = validateProducts();
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join('; ') });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });

      if (!response.ok) {
        throw new Error('Erro ao cadastrar produtos');
      }

      const result = await response.json();
      setMessage({ type: 'success', text: `${result.count} produtos cadastrados com sucesso!` });
      setProducts([{ ...defaultProduct }]);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao cadastrar produtos. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const exportTemplate = () => {
    const csvContent = [
      'name,price,category,subcategory,brand,description,specifications,stock,sku,barcode,weight,dimensions,images,tags,active',
      'Cimento CP II 50kg,25.90,Cimento e Argamassa,Cimento,Votoran,"Cimento Portland CP II-E-32","Resistência: 32 MPa",100,CIM001,7891234567890,50,"50x30x10cm","https://example.com/img1.jpg|https://example.com/img2.jpg","cimento,construção,votoran",true'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_produtos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cadastro de Produtos em Massa</h1>
          <div className="flex gap-4">
            <button
              onClick={exportTemplate}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              <Download className="h-4 w-4" />
              Template CSV
            </button>
            <button
              onClick={addProduct}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              <Plus className="h-4 w-4" />
              Adicionar Produto
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {products.map((product, productIndex) => (
              <div key={productIndex} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Produto {productIndex + 1}</h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateProduct(productIndex)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicar
                    </button>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(productIndex)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Informações Básicas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(productIndex, 'name', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => updateProduct(productIndex, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                    <select
                      value={product.category}
                      onChange={(e) => updateProduct(productIndex, 'category', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoria</label>
                    <input
                      type="text"
                      value={product.subcategory}
                      onChange={(e) => updateProduct(productIndex, 'subcategory', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                    <input
                      type="text"
                      value={product.brand}
                      onChange={(e) => updateProduct(productIndex, 'brand', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      value={product.sku}
                      onChange={(e) => updateProduct(productIndex, 'sku', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                    <input
                      type="text"
                      value={product.barcode}
                      onChange={(e) => updateProduct(productIndex, 'barcode', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => updateProduct(productIndex, 'stock', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={product.weight}
                      onChange={(e) => updateProduct(productIndex, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Campos de texto longo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={product.description}
                      onChange={(e) => updateProduct(productIndex, 'description', e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Especificações</label>
                    <textarea
                      value={product.specifications}
                      onChange={(e) => updateProduct(productIndex, 'specifications', e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Dimensões e Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dimensões (LxAxP)</label>
                    <input
                      type="text"
                      value={product.dimensions}
                      onChange={(e) => updateProduct(productIndex, 'dimensions', e.target.value)}
                      placeholder="ex: 50x30x10cm"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={product.tags.join(', ')}
                      onChange={(e) => handleTagsChange(productIndex, e.target.value)}
                      placeholder="ex: cimento, construção, votoran"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Imagens */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagens</label>
                  {product.images.map((image, imageIndex) => (
                    <div key={imageIndex} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => updateProductImage(productIndex, imageIndex, e.target.value)}
                        placeholder="URL da imagem"
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {product.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageField(productIndex, imageIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addImageField(productIndex)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Adicionar imagem
                  </button>
                </div>

                {/* Status */}
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={product.active}
                      onChange={(e) => updateProduct(productIndex, 'active', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Produto ativo</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setProducts([{ ...defaultProduct }])}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
            >
              Limpar Tudo
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : `Cadastrar ${products.length} Produto(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
