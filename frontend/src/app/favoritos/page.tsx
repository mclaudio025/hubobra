'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, Grid, List, Package, Filter, SortAsc, SortDesc, Share2, Download } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toaster';
import FavoriteCard from '../components/FavoriteCard';

export default function FavoritesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'dateAdded'>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [priceFilter, setPriceFilter] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [showFilters, setShowFilters] = useState(false);
  
  const { favorites, removeFromFavorites, clearFavorites, totalFavorites } = useFavorites();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();



  const handleAddAllToCart = async () => {
    try {
      for (const product of filteredAndSortedFavorites) {
        await addToCart(product.id, 1);
      }
      addToast({
        type: 'success',
        title: 'Produtos adicionados',
        message: `${filteredAndSortedFavorites.length} produtos foram adicionados ao carrinho`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível adicionar todos os produtos ao carrinho'
      });
    }
  };

  const handleShareFavorites = () => {
    const favoritesList = favorites.map(p => `${p.name} - ${formatCurrency(p.price)}`).join('\n');
    const shareText = `Meus produtos favoritos:\n\n${favoritesList}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Meus Favoritos',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      addToast({
        type: 'success',
        title: 'Copiado',
        message: 'Lista de favoritos copiada para a área de transferência'
      });
    }
  };

  const handleExportFavorites = () => {
    const csvContent = [
      'Nome,Preço,SKU',
      ...favorites.map(p => `"${p.name}","${p.price}","${p.sku}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meus-favoritos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    addToast({
      type: 'success',
      title: 'Exportado',
      message: 'Lista de favoritos exportada com sucesso'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Filtrar e ordenar favoritos
  const filteredAndSortedFavorites = useMemo(() => {
    let filtered = favorites.filter(product => 
      product.price >= priceFilter.min && product.price <= priceFilter.max
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'dateAdded':
          // Como não temos data de adição, usar ordem atual
          comparison = favorites.indexOf(a) - favorites.indexOf(b);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [favorites, sortBy, sortOrder, priceFilter]);

  const totalValue = useMemo(() => {
    return filteredAndSortedFavorites.reduce((sum, product) => sum + product.price, 0);
  }, [filteredAndSortedFavorites]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600 mb-4">Você precisa estar logado para ver seus favoritos</p>
          <Link
            href="/login"
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meus Favoritos</h1>
                <p className="text-gray-600">
                  {filteredAndSortedFavorites.length} de {totalFavorites} produto{totalFavorites !== 1 ? 's' : ''} • 
                  Valor total: {formatCurrency(totalValue)}
                </p>
              </div>
            </div>
            
            {totalFavorites > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${
                    showFilters ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </button>

                {/* Sort */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as 'name' | 'price' | 'dateAdded');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="dateAdded-desc">Mais recentes</option>
                  <option value="dateAdded-asc">Mais antigos</option>
                  <option value="name-asc">Nome A-Z</option>
                  <option value="name-desc">Nome Z-A</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-gray-300 rounded">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* Actions */}
                <button
                  onClick={handleAddAllToCart}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm font-medium"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Adicionar Todos
                </button>

                <button
                  onClick={handleShareFavorites}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 px-3 py-2 border border-blue-300 rounded text-sm font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </button>

                <button
                  onClick={handleExportFavorites}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-700 px-3 py-2 border border-gray-300 rounded text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
                
                <button
                  onClick={clearFavorites}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 px-3 py-2 border border-red-300 rounded text-sm font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics */}
        {totalFavorites > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalFavorites}</p>
                  <p className="text-sm text-gray-600">Total de Favoritos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{filteredAndSortedFavorites.length}</p>
                  <p className="text-sm text-gray-600">Produtos Filtrados</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">R$</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                  <p className="text-sm text-gray-600">Valor Total</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">Ø</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredAndSortedFavorites.length > 0 ? formatCurrency(totalValue / filteredAndSortedFavorites.length) : 'R$ 0,00'}
                  </p>
                  <p className="text-sm text-gray-600">Preço Médio</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && totalFavorites > 0 && (
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Filtros</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faixa de Preço
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceFilter.min}
                    onChange={(e) => setPriceFilter(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-gray-500">até</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceFilter.max}
                    onChange={(e) => setPriceFilter(prev => ({ ...prev, max: Number(e.target.value) || 10000 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              {/* Quick Price Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtros Rápidos
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPriceFilter({ min: 0, max: 50 })}
                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Até R$ 50
                  </button>
                  <button
                    onClick={() => setPriceFilter({ min: 50, max: 200 })}
                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    R$ 50 - R$ 200
                  </button>
                  <button
                    onClick={() => setPriceFilter({ min: 200, max: 10000 })}
                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Acima de R$ 200
                  </button>
                </div>
              </div>

              {/* Reset Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => setPriceFilter({ min: 0, max: 10000 })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        )}

        {totalFavorites === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nenhum favorito ainda</h2>
            <p className="text-gray-600 mb-8">
              Adicione produtos aos seus favoritos para vê-los aqui
            </p>
            <Link
              href="/"
              className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition inline-flex items-center gap-2"
            >
              <Package className="h-5 w-5" />
              Explorar Produtos
            </Link>
          </div>
        ) : filteredAndSortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nenhum produto encontrado</h2>
            <p className="text-gray-600 mb-8">
              Ajuste os filtros para ver mais produtos
            </p>
            <button
              onClick={() => {
                setPriceFilter({ min: 0, max: 10000 });
                setShowFilters(false);
              }}
              className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredAndSortedFavorites.map((product) => (
              <FavoriteCard 
                key={product.id} 
                product={product} 
                viewMode={viewMode} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
