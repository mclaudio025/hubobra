import express, { Request, Response } from 'express';
import cors from 'cors';
import componentsRouter from './components/components.routes';
import productsRouter from './products/products.routes';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumenta limite para uploads grandes
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/components', componentsRouter);
app.use('/api/products', productsRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});