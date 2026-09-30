import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  bulkCreateProducts,
  updateProduct,
  deleteProduct,
  importProducts,
  upload
} from './products.controller';

const router = Router();

// Rotas básicas
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Rotas para cadastro em massa
router.post('/bulk', bulkCreateProducts);
router.post('/import', upload.single('file'), importProducts);

export default router;