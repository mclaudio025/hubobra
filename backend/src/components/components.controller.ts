import { Request, Response } from 'express';

interface ComponentConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

let components: ComponentConfig[] = [
  { id: 'hero-carousel', name: 'Carrossel Hero', enabled: true, order: 1 },
  { id: 'weekly-offers', name: 'Ofertas da Semana', enabled: true, order: 2 },
  { id: 'promotional-banners', name: 'Banners Promocionais', enabled: true, order: 3 },
  { id: 'featured-products', name: 'Produtos em Destaque', enabled: true, order: 4 },
  { id: 'carousel', name: 'Carrossel', enabled: true, order: 5 },
  { id: 'department-shortcuts', name: 'Atalhos de Departamentos', enabled: true, order: 6 },
  { id: 'footer', name: 'Rodapé', enabled: true, order: 7 },
];

export const getComponentsConfig = (req: Request, res: Response) => {
  res.json(components.sort((a, b) => a.order - b.order));
};

export const updateComponentsConfig = (req: Request, res: Response) => {
  const updatedConfig = req.body as ComponentConfig[];
  // Adicionar validação aqui no futuro
  components = updatedConfig;
  res.json(components.sort((a, b) => a.order - b.order));
};