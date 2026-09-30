import { Request, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

interface Product {
  id?: string;
  name: string;
  price: number;
  category: string;
  subcategory?: string;
  brand?: string;
  description?: string;
  specifications?: string;
  stock?: number;
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  images?: string[];
  tags?: string[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Mock data para produtos
let products: Product[] = [
  {
    id: '1',
    name: 'Cimento CP II 50kg',
    price: 25.90,
    category: 'Cimento e Argamassa',
    subcategory: 'Cimento',
    brand: 'Votoran',
    description: 'Cimento Portland CP II-E-32 para uso geral em construção civil',
    specifications: 'Resistência: 32 MPa, Tempo de pega: 1-10h, Ideal para concretos e argamassas',
    stock: 100,
    sku: 'CIM001',
    barcode: '7891234567890',
    weight: 50,
    dimensions: '50x30x10cm',
    images: ['/images/cimento.jpg'],
    tags: ['cimento', 'construção', 'votoran'],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Tijolo Cerâmico 6 Furos',
    price: 0.45,
    category: 'Tijolos e Blocos',
    subcategory: 'Tijolo Cerâmico',
    brand: 'Cerâmica São João',
    description: 'Tijolo cerâmico de 6 furos para alvenaria de vedação',
    specifications: 'Dimensões: 14x19x29cm, Resistência: 2,5 MPa, Absorção de água: 8-22%',
    stock: 5000,
    sku: 'TIJ001',
    barcode: '7891234567891',
    weight: 2.8,
    dimensions: '14x19x29cm',
    images: ['/images/tijolo.jpg'],
    tags: ['tijolo', 'cerâmico', 'alvenaria'],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Tinta Acrílica Branca 18L',
    price: 89.90,
    category: 'Tintas e Vernizes',
    subcategory: 'Tinta Acrílica',
    brand: 'Suvinil',
    description: 'Tinta acrílica premium para paredes internas e externas',
    specifications: 'Cobertura: 35m²/L, Secagem: 30min, Diluição: até 20% com água',
    stock: 50,
    sku: 'TIN001',
    barcode: '7891234567892',
    weight: 18,
    dimensions: '25x25x35cm',
    images: ['/images/tinta.jpg'],
    tags: ['tinta', 'acrílica', 'branca', 'suvinil'],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const getProducts = (req: Request, res: Response) => {
  const { page = 1, limit = 20, search = '', category = '', status = '' } = req.query;
  
  let filteredProducts = products;

  // Filtro por busca
  if (search) {
    const searchTerm = search.toString().toLowerCase();
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm)
    );
  }

  // Filtro por categoria
  if (category) {
    filteredProducts = filteredProducts.filter(product => 
      product.category === category
    );
  }

  // Filtro por status
  if (status) {
    const isActive = status === 'active';
    filteredProducts = filteredProducts.filter(product => 
      product.active === isActive
    );
  }

  // Paginação
  const pageNum = parseInt(page.toString());
  const limitNum = parseInt(limit.toString());
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProducts.length / limitNum);

  res.json({
    products: paginatedProducts,
    totalProducts: filteredProducts.length,
    currentPage: pageNum,
    totalPages,
    hasNext: endIndex < filteredProducts.length,
    hasPrev: startIndex > 0
  });
};

export const getProductById = (req: Request, res: Response) => {
  const { id } = req.params;
  const product = products.find(p => p.id === id);
  
  if (!product) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
  
  res.json(product);
};

export const createProduct = (req: Request, res: Response) => {
  const newProducts = req.body;
  
  if (Array.isArray(newProducts)) {
    // Cadastro em massa
    const productsWithIds = newProducts.map((product, index) => ({
      ...product,
      id: (products.length + index + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: product.active !== undefined ? product.active : true,
      stock: product.stock || 0,
      images: product.images || [],
      tags: product.tags || []
    }));
    
    products.push(...productsWithIds);
    res.status(201).json({ 
      message: 'Produtos criados com sucesso', 
      count: productsWithIds.length,
      products: productsWithIds 
    });
  } else {
    // Produto único
    const newProduct: Product = {
      ...newProducts,
      id: (products.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: newProducts.active !== undefined ? newProducts.active : true,
      stock: newProducts.stock || 0,
      images: newProducts.images || [],
      tags: newProducts.tags || []
    };
    
    products.push(newProduct);
    res.status(201).json({ message: 'Produto criado com sucesso', product: newProduct });
  }
};

export const bulkCreateProducts = (req: Request, res: Response) => {
  const { products: newProducts } = req.body;
  
  if (!Array.isArray(newProducts)) {
    return res.status(400).json({ message: 'Dados inválidos. Esperado array de produtos.' });
  }

  const errors: Array<{ row: number; message: string; data: any }> = [];
  const warnings: Array<{ row: number; message: string; data: any }> = [];
  const validProducts: Product[] = [];

  newProducts.forEach((product, index) => {
    const row = index + 1;
    
    // Validações obrigatórias
    if (!product.name) {
      errors.push({ row, message: 'Nome é obrigatório', data: product });
      return;
    }
    
    if (!product.price || product.price <= 0) {
      errors.push({ row, message: 'Preço deve ser maior que zero', data: product });
      return;
    }
    
    if (!product.category) {
      errors.push({ row, message: 'Categoria é obrigatória', data: product });
      return;
    }
    
    if (!product.sku) {
      errors.push({ row, message: 'SKU é obrigatório', data: product });
      return;
    }

    // Verificar SKU duplicado
    const existingSku = products.find(p => p.sku === product.sku) || 
                       validProducts.find(p => p.sku === product.sku);
    if (existingSku) {
      errors.push({ row, message: `SKU ${product.sku} já existe`, data: product });
      return;
    }

    // Avisos
    if (!product.description) {
      warnings.push({ row, message: 'Descrição não informada', data: product });
    }
    
    if (!product.stock || product.stock === 0) {
      warnings.push({ row, message: 'Produto sem estoque', data: product });
    }

    // Produto válido
    const validProduct: Product = {
      ...product,
      id: (products.length + validProducts.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: product.active !== undefined ? product.active : true,
      stock: product.stock || 0,
      images: Array.isArray(product.images) ? product.images : 
              typeof product.images === 'string' ? product.images.split('|').filter(img => img.trim()) : [],
      tags: Array.isArray(product.tags) ? product.tags :
            typeof product.tags === 'string' ? product.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };

    validProducts.push(validProduct);
  });

  // Adicionar produtos válidos
  products.push(...validProducts);

  res.json({
    success: validProducts.length,
    errors,
    warnings,
    message: `${validProducts.length} produtos importados com sucesso`
  });
};

export const updateProduct = (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  
  const productIndex = products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
  
  products[productIndex] = {
    ...products[productIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  res.json({ message: 'Produto atualizado com sucesso', product: products[productIndex] });
};

export const deleteProduct = (req: Request, res: Response) => {
  const { id } = req.params;
  const productIndex = products.findIndex(p => p.id === id);
  
  if (productIndex === -1) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
  
  const deletedProduct = products.splice(productIndex, 1)[0];
  res.json({ message: 'Produto excluído com sucesso', product: deletedProduct });
};

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV e Excel são permitidos'));
    }
  }
});

export const importProducts = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado' });
  }

  const results: any[] = [];
  const errors: Array<{ row: number; message: string; data: any }> = [];
  const warnings: Array<{ row: number; message: string; data: any }> = [];

  // Converter buffer para stream
  const stream = Readable.from(req.file.buffer.toString());
  
  stream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Processar dados CSV
      const validProducts: Product[] = [];
      
      results.forEach((row, index) => {
        const rowNum = index + 2; // +2 porque index começa em 0 e temos header
        
        // Validações
        if (!row.name) {
          errors.push({ row: rowNum, message: 'Nome é obrigatório', data: row });
          return;
        }
        
        if (!row.price || isNaN(parseFloat(row.price))) {
          errors.push({ row: rowNum, message: 'Preço inválido', data: row });
          return;
        }
        
        if (!row.category) {
          errors.push({ row: rowNum, message: 'Categoria é obrigatória', data: row });
          return;
        }
        
        if (!row.sku) {
          errors.push({ row: rowNum, message: 'SKU é obrigatório', data: row });
          return;
        }

        // Verificar SKU duplicado
        const existingSku = products.find(p => p.sku === row.sku) || 
                           validProducts.find(p => p.sku === row.sku);
        if (existingSku) {
          errors.push({ row: rowNum, message: `SKU ${row.sku} já existe`, data: row });
          return;
        }

        // Avisos
        if (!row.description) {
          warnings.push({ row: rowNum, message: 'Descrição não informada', data: row });
        }

        // Criar produto válido
        const product: Product = {
          id: (products.length + validProducts.length + 1).toString(),
          name: row.name,
          price: parseFloat(row.price),
          category: row.category,
          subcategory: row.subcategory || '',
          brand: row.brand || '',
          description: row.description || '',
          specifications: row.specifications || '',
          stock: parseInt(row.stock) || 0,
          sku: row.sku,
          barcode: row.barcode || '',
          weight: parseFloat(row.weight) || 0,
          dimensions: row.dimensions || '',
          images: row.images ? row.images.split('|').filter((img: string) => img.trim()) : [],
          tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
          active: row.active === 'true' || row.active === true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        validProducts.push(product);
      });

      // Adicionar produtos válidos
      products.push(...validProducts);

      res.json({
        success: validProducts.length,
        errors,
        warnings,
        message: `${validProducts.length} produtos importados com sucesso`
      });
    })
    .on('error', (error) => {
      res.status(500).json({ message: 'Erro ao processar arquivo CSV', error: error.message });
    });
};