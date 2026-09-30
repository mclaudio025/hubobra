import { Router } from 'express';
import { getComponentsConfig, updateComponentsConfig } from './components.controller';

const router = Router();

router.get('/config', getComponentsConfig);
router.put('/config', updateComponentsConfig);

export default router;