import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuoteItemDto {
  @ApiProperty({ description: 'Nome do produto orçado' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'ID do produto no catálogo (se houver)' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Marca do produto' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: 'Unidade de medida', default: 'UN' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ description: 'Quantidade orçada', default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Preço unitário em Reais' })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateQuoteDto {
  @ApiProperty({ description: 'Nome do cliente' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ description: 'Telefone ou WhatsApp do cliente (com DDD)' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiPropertyOptional({ description: 'Email do cliente' })
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'ID do usuário cadastrado na loja' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'ID da loja (multi-tenant)' })
  @IsString()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Desconto aplicado em Reais', default: 0 })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ description: 'Frete estimado em Reais', default: 0 })
  @IsNumber()
  @IsOptional()
  shipping?: number;

  @ApiPropertyOptional({ description: 'Observações do orçamento ou da obra' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Lista de itens do orçamento', type: [CreateQuoteItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items: CreateQuoteItemDto[];
}
