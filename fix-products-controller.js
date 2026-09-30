const fs = require('fs');

console.log('🔧 Criando versão simplificada do ProductsController...\n');

const simplifiedController = `import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de produtos' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('active') active?: boolean,
    @Query('featured') featured?: boolean,
  ) {
    return this.productsService.findAll(page, limit, search, categoryId, active, featured);
  }

  @Get('test')
  test() {
    return { message: 'ProductsController funcionando!', timestamp: new Date() };
  }
}`;

// Fazer backup do controller original
const originalPath = 'backend-nestjs/src/products/products.controller.ts';
const backupPath = 'backend-nestjs/src/products/products.controller.backup.ts';

console.log('📋 Fazendo backup do controller original...');
fs.copyFileSync(originalPath, backupPath);

console.log('✏️ Criando versão simplificada...');
fs.writeFileSync(originalPath, simplifiedController);

console.log('✅ Controller simplificado criado!');
console.log('📁 Backup salvo em: products.controller.backup.ts');
console.log('🔄 Reinicie o backend para testar');

console.log('\n⚠️ Para restaurar o controller original:');
console.log('   cp backend-nestjs/src/products/products.controller.backup.ts backend-nestjs/src/products/products.controller.ts');