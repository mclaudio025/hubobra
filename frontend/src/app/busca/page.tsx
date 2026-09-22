'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  RotateCcw,
  SlidersHorizontal,
  X,
  Filter
} from 'lucide-react';
import { useProducts, useCategories } from '../hooks/useApi';
import ProductCard from '../components/ProductCard';
import Loading from '../components/ui/Loading';

interface Category {
  id: string;
  name: string;
  slug: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('categoria') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'discount' | 'name'>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Accordion states
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    categoria: true,
    marca: true,
    preco: true,
    ofertas: true,
  });

  const productsApi = useProducts();
  const categoriesApi = useCategories();

  useEffect(() => {
    setSearchInput(queryParam);
    setSelectedCategory(categoryParam);
  }, [queryParam, categoryParam]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    searchProducts();
  }, [queryParam, selectedCategory]);

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.getCategories(true);
      const catList = Array.isArray(res) ? res : [];
      setCategories(catList);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsApi.getProducts({
        page: 1,
        limit: 100,
        search: queryParam ? queryParam.trim() : undefined,
        categoryId: selectedCategory ? selectedCategory : undefined,
        active: true,
      });

      const prods = Array.isArray(res?.products)
        ? res.products
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      setProducts(prods);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set('q', searchInput.trim());
    if (selectedCategory) params.set('categoria', selectedCategory);
    router.push(`/busca?${params.toString()}`);
  };

  const toggleAccordion = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Dynamic brand extraction
  const brandOptions = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => {
      const b = p.brand || p.marca;
      if (b && typeof b === 'string') {
        const brandClean = b.trim();
        if (brandClean) {
          map.set(brandClean, (map.get(brandClean) || 0) + 1);
        }
      }
    });
    const list: { name: string; count: number }[] = [];
    map.forEach((count, name) => list.push({ name, count }));
    return list.sort((a, b) => b.count - a.count);
  }, [products]);

  const priceRanges = [
    { id: 'under50', label: 'Até R$ 50', min: 0, max: 50 },
    { id: '50to100', label: 'R$ 50 a R$ 100', min: 50, max: 100 },
    { id: '100to250', label: 'R$ 100 a R$ 250', min: 100, max: 250 },
    { id: 'above250', label: 'Acima de R$ 250', min: 250, max: Infinity },
  ];

  const priceRangeCounts = useMemo(() => {
    return priceRanges.map(range => {
      const count = products.filter(p => {
        const price = p.price || 0;
        return price >= range.min && price < range.max;
      }).length;
      return { ...range, count };
    });
  }, [products]);

  // Apply filters locally on the search results
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Brand filter
      if (selectedBrands.length > 0) {
        const prodBrand = product.brand || product.marca;
        if (!selectedBrands.includes(prodBrand)) {
          return false;
        }
      }

      // Price range filter
      if (selectedPriceRanges.length > 0) {
        const price = product.price || 0;
        const matchesAnyRange = selectedPriceRanges.some(rangeId => {
          const r = priceRanges.find(range => range.id === rangeId);
          if (!r) return false;
          return price >= r.min && price < range.max;
        });
        if (!matchesAnyRange) return false;
      }

      // Offers filter
      if (onlyOffers) {
        const hasDiscount = product.comparePrice && product.comparePrice > product.price;
        if (!hasDiscount) return false;
      }

      // Stock filter
      if (inStockOnly) {
        const stock = product.stock ?? 1;
        if (stock <= 0) return false;
      }

      return true;
    });
  }, [products, selectedBrands, selectedPriceRanges, onlyOffers, inStockOnly]);

  // Apply sorting
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'discount') {
        const discA = a.comparePrice ? ((a.comparePrice - a.price) / a.comparePrice) : 0;
        const discB = b.comparePrice ? ((b.comparePrice - b.price) / b.comparePrice) : 0;
        return discB - discA;
      }
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [filteredProducts, sortBy]);

  const activeFilterCount = selectedBrands.length + selectedPriceRanges.length + (onlyOffers ? 1 : 0) + (inStockOnly ? 1 : 0) + (selectedCategory ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedPriceRanges([]);
    setOnlyOffers(false);
    setInStockOnly(false);
    if (selectedCategory) {
      setSelectedCategory('');
      router.push(`/busca?q=${encodeURIComponent(queryParam)}`);
    }
  };

  const handleBrandToggle = (name: string) => {
    setSelectedBrands(prev => 
      prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]
    );
  };

  const handlePriceRangeToggle = (id: string) => {
    setSelectedPriceRanges(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Render Sidebar Filters Content
  const renderFilterContent = () => (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
          <span>Filtrar por</span>
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-[#009de0] hover:underline flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Categorias */}
      {categories.length > 0 && (
        <div className="border-b border-gray-100 pb-4">
          <button
            onClick={() => toggleAccordion('categoria')}
            className="w-full flex items-center justify-between py-1 text-left font-bold text-xs uppercase tracking-wide text-gray-900 hover:text-[#009de0]"
          >
            <span>DEPARTAMENTOS</span>
            {openSections.categoria ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {openSections.categoria && (
            <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <label className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-black cursor-pointer select-none">
                <input
                  type="radio"
                  name="category"
                  checked={!selectedCategory}
                  onChange={() => {
                    setSelectedCategory('');
                    const params = new URLSearchParams();
                    if (queryParam) params.set('q', queryParam);
                    router.push(`/busca?${params.toString()}`);
                  }}
                  className="w-4 h-4 text-[#009de0] focus:ring-[#009de0]"
                />
                <span className="flex-1 font-medium">Todos os Departamentos</span>
              </label>
              {categories.map(cat => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-black cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.id}
                    onChange={() => {
                      setSelectedCategory(cat.id);
                      const params = new URLSearchParams();
                      if (queryParam) params.set('q', queryParam);
                      params.set('categoria', cat.id);
                      router.push(`/busca?${params.toString()}`);
                    }}
                    className="w-4 h-4 text-[#009de0] focus:ring-[#009de0]"
                  />
                  <span className="flex-1 line-clamp-1">{cat.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Marcas */}
      {brandOptions.length > 0 && (
        <div className="border-b border-gray-100 pb-4">
          <button
            onClick={() => toggleAccordion('marca')}
            className="w-full flex items-center justify-between py-1 text-left font-bold text-xs uppercase tracking-wide text-gray-900 hover:text-[#009de0]"
          >
            <span>MARCA</span>
            {openSections.marca ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {openSections.marca && (
            <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1">
              {brandOptions.map(b => (
                <label
                  key={b.name}
                  className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-black cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b.name)}
                    onChange={() => handleBrandToggle(b.name)}
                    className="w-4 h-4 rounded border-gray-300 text-[#009de0] focus:ring-[#009de0]"
                  />
                  <span className="flex-1 line-clamp-1">{b.name}</span>
                  <span className="text-gray-400 text-[11px]">({b.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Faixa de Preço */}
      <div className="border-b border-gray-100 pb-4">
        <button
          onClick={() => toggleAccordion('preco')}
          className="w-full flex items-center justify-between py-1 text-left font-bold text-xs uppercase tracking-wide text-gray-900 hover:text-[#009de0]"
        >
          <span>FAIXA DE PREÇO</span>
          {openSections.preco ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {openSections.preco && (
          <div className="mt-2.5 space-y-2">
            {priceRangeCounts.map(range => (
              <label
                key={range.id}
                className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-black cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={selectedPriceRanges.includes(range.id)}
                  onChange={() => handlePriceRangeToggle(range.id)}
                  className="w-4 h-4 rounded border-gray-300 text-[#009de0] focus:ring-[#009de0]"
                />
                <span className="flex-1">{range.label}</span>
                {range.count > 0 && (
                  <span className="text-gray-400 text-[11px]">({range.count})</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Ofertas & Estoque */}
      <div className="border-b border-gray-100 pb-4">
        <button
          onClick={() => toggleAccordion('ofertas')}
          className="w-full flex items-center justify-between py-1 text-left font-bold text-xs uppercase tracking-wide text-gray-900 hover:text-[#009de0]"
        >
          <span>OFERTAS & ESTOQUE</span>
          {openSections.ofertas ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {openSections.ofertas && (
          <div className="mt-2.5 space-y-2">
            <label className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-black cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyOffers}
                onChange={(e) => setOnlyOffers(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#009de0] focus:ring-[#009de0]"
              />
              <span className="flex-1">Apenas em Oferta / Promoção</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-black cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#009de0] focus:ring-[#009de0]"
              />
              <span className="flex-1">Pronta Entrega em Estoque</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20" suppressHydrationWarning>
      {/* 1. Breadcrumb (Home > Busca) */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <nav className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-[#009de0] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <Link href="/produtos" className="hover:text-[#009de0] transition-colors">
              Catálogo
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-900 font-bold">
              {queryParam ? `Busca: "${queryParam}"` : 'Buscar Produtos'}
            </span>
          </nav>
        </div>
      </div>

      {/* 2. Main Container (Sidebar + Results) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Desktop Left Sidebar ("Filtrar por") */}
          <aside className="hidden lg:block w-64 shrink-0 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {renderFilterContent()}
          </aside>

          {/* Right Column: Title Bar & Product Grid */}
          <main className="flex-1 w-full">
            
            {/* Header: Title + Count + Sort Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-100">
              <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {queryParam ? `Resultados para "${queryParam}"` : 'Todos os Produtos'}
                </h1>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  Foram encontrados <strong className="text-gray-800 font-semibold">{sortedProducts.length}</strong> {sortedProducts.length === 1 ? 'Produto' : 'Produtos'}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 bg-white shadow-sm hover:bg-gray-50"
                >
                  <Filter className="w-3.5 h-3.5 text-[#009de0]" />
                  <span>Filtrar {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
                </button>

                {/* Sort Selector */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">
                    Ordenar por
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#009de0] shadow-sm cursor-pointer"
                  >
                    <option value="featured">Relevância</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                    <option value="discount">Maior Desconto</option>
                    <option value="name">Nome (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filter Pills */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-gray-500 font-medium">Filtros ativos:</span>
                {selectedBrands.map(b => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 bg-blue-50 text-[#009de0] border border-blue-200 text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {b}
                    <button onClick={() => handleBrandToggle(b)} className="hover:text-black">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedPriceRanges.map(rId => {
                  const r = priceRanges.find(p => p.id === rId);
                  return (
                    <span
                      key={rId}
                      className="inline-flex items-center gap-1 bg-blue-50 text-[#009de0] border border-blue-200 text-xs px-2.5 py-1 rounded-full font-medium"
                    >
                      {r?.label}
                      <button onClick={() => handlePriceRangeToggle(rId)} className="hover:text-black">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {onlyOffers && (
                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-xs px-2.5 py-1 rounded-full font-medium">
                    Em Oferta
                    <button onClick={() => setOnlyOffers(false)} className="hover:text-black">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-1 rounded-full font-medium">
                    Em Estoque
                    <button onClick={() => setInStockOnly(false)} className="hover:text-black">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-600 hover:underline font-semibold ml-1"
                >
                  Limpar todos
                </button>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loading size="lg" text="Buscando produtos..." />
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200 p-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-800 mb-1">Nenhum produto encontrado</h3>
                <p className="text-gray-500 text-xs max-w-sm mx-auto mb-6">
                  Não encontramos nenhum item correspondente à sua busca. Tente buscar por outros termos como "cimento", "tinta", "joelho", "tubo".
                </p>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 bg-[#009de0] hover:bg-[#0088c6] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition shadow-sm"
                >
                  Limpar Todos os Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {sortedProducts.map((product) => (
                  <div key={product.id} className="h-full">
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      comparePrice={product.comparePrice}
                      description={product.description}
                      images={product.images}
                      sku={product.sku || product.barcode}
                      barcode={product.barcode}
                      stock={product.stock}
                      brand={product.brand}
                      isFeatured={product.featured || product.isFeatured}
                      showAddToCart={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                <span className="font-bold text-gray-900 text-base">Filtros</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderFilterContent()}
            </div>

            <div className="pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full bg-[#009de0] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-[#0088c6] transition"
              >
                Ver {sortedProducts.length} {sortedProducts.length === 1 ? 'Produto' : 'Produtos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchContent />
    </Suspense>
  );
}
