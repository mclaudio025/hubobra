import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
  Min,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

class ProductImageDto {
  @ApiProperty({
    description: "ID da imagem (opcional)",
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: "URL da imagem",
    example: "https://example.com/image.jpg",
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: "Texto alternativo da imagem",
    example: "Cimento CP II 50kg",
    required: false,
  })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiProperty({
    description: "Ordem da imagem",
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({
    description: "Se é a imagem principal",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}

class ProductAttributeDto {
  @ApiProperty({
    description: "ID do atributo",
    example: "uuid-do-atributo",
  })
  @IsString()
  @IsUUID("4")
  attributeId: string;

  @ApiProperty({
    description: "ID da opção do atributo (opcional se valor customizado)",
    example: "uuid-da-opcao",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID("4")
  optionId?: string;

  @ApiProperty({
    description: "Valor customizado (se não usar opção)",
    example: "Valor personalizado",
    required: false,
  })
  @IsOptional()
  @IsString()
  value?: string;
}

class ProductVariationDto {
  @ApiProperty({
    description: "ID da opção de variação",
    example: "uuid-da-opcao-variacao",
  })
  @IsString()
  @IsUUID("4")
  optionId: string;
}

export class CreateProductDto {
  @ApiProperty({
    description: "Nome do produto",
    example: "Cimento CP II 50kg",
  })
  @IsString({ message: "Nome deve ser uma string" })
  @IsNotEmpty({ message: "Nome é obrigatório" })
  @MaxLength(255, { message: "Nome deve ter no máximo 255 caracteres" })
  name: string;

  @ApiProperty({
    description: "Descrição do produto",
    example: "Cimento Portland CP II-E-32 para uso geral em construção civil",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Descrição deve ser uma string" })
  description?: string;

  @ApiProperty({
    description: "Especificações técnicas do produto",
    example: "Resistência: 32 MPa, Tempo de pega: 1-10h",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Especificações devem ser uma string" })
  specifications?: string;

  @ApiProperty({
    description: "Preço do produto",
    example: 25.9,
  })
  @IsNumber({}, { message: "Preço deve ser um número" })
  @Min(0.01, { message: "Preço deve ser maior que zero" })
  price: number;

  @ApiProperty({
    description: 'Preço comparativo (preço "de")',
    example: 29.9,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Preço comparativo deve ser um número" })
  @Min(0, { message: "Preço comparativo deve ser maior que zero" })
  comparePrice?: number;

  @ApiProperty({
    description: "Preço de custo (apenas admin)",
    example: 18.5,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Preço de custo deve ser um número" })
  @Min(0, { message: "Preço de custo deve ser maior que zero" })
  cost?: number;

  @ApiProperty({
    description: "Quantidade em estoque",
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Estoque deve ser um número" })
  @Min(0, { message: "Estoque não pode ser negativo" })
  stock?: number;

  @ApiProperty({
    description: "Estoque mínimo para alerta",
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Estoque mínimo deve ser um número" })
  @Min(0, { message: "Estoque mínimo deve ser maior ou igual a zero" })
  minStock?: number;

  @ApiProperty({
    description: "SKU do produto",
    example: "CIM001",
  })
  @IsString({ message: "SKU deve ser uma string" })
  @IsNotEmpty({ message: "SKU é obrigatório" })
  @MaxLength(50, { message: "SKU deve ter no máximo 50 caracteres" })
  sku: string;

  @ApiProperty({
    description: "Código de barras do produto",
    example: "7891234567890",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Código de barras deve ser uma string" })
  barcode?: string;

  @ApiProperty({
    description: "Marca do produto",
    example: "Votoran",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Marca deve ser uma string" })
  brand?: string;

  @ApiProperty({
    description: "Modelo do produto",
    example: "CP II-E-32",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Modelo deve ser uma string" })
  model?: string;

  @ApiProperty({
    description: "Peso do produto em kg",
    example: 50.0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Peso deve ser um número" })
  @Min(0, { message: "Peso não pode ser negativo" })
  weight?: number;

  @ApiProperty({
    description: "Dimensões do produto",
    example: "50x30x10cm",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Dimensões devem ser uma string" })
  dimensions?: string;

  @ApiProperty({
    description: "Garantia do produto",
    example: "12 meses",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Garantia deve ser uma string" })
  warranty?: string;

  @ApiProperty({
    description: "Origem/fabricação do produto",
    example: "Brasil",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Origem deve ser uma string" })
  origin?: string;

  @ApiProperty({
    description: "Unidade de medida do produto (UN, SACO, MILHEIRO, M2, LATA, KG, METRO, BARRA, CX, ROLO)",
    example: "UN",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Unidade deve ser uma string" })
  unit?: string;

  @ApiProperty({
    description: "Multiplicador ou fração de unidade",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Multiplicador de unidade deve ser um número" })
  unitMultiplier?: number;

  @ApiProperty({
    description: "ID da loja (Tenant)",
    required: false,
  })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty({
    description: "ID da categoria",
    example: "uuid-da-categoria",
  })
  @IsUUID(4, { message: "ID da categoria deve ser um UUID válido" })
  @IsNotEmpty({ message: "Categoria é obrigatória" })
  categoryId: string;

  @ApiProperty({
    description: "ID do produto pai (para variações)",
    example: "uuid-do-produto-pai",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "ID do produto pai deve ser uma string" })
  @IsUUID("4", { message: "ID do produto pai deve ser um UUID válido" })
  parentProductId?: string;

  @ApiProperty({
    description: "Se o produto tem variações",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "hasVariations deve ser um boolean" })
  hasVariations?: boolean;

  @ApiProperty({
    description: "Se o produto é uma variação",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "isVariation deve ser um boolean" })
  isVariation?: boolean;

  @ApiProperty({
    description: "Se o produto está ativo",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "Active deve ser um boolean" })
  active?: boolean;

  @ApiProperty({
    description: "Se o produto é destaque",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "Featured deve ser um boolean" })
  featured?: boolean;

  @ApiProperty({
    description: "Imagens do produto",
    type: [ProductImageDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: "Imagens devem ser um array" })
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @ApiProperty({
    description: "Tags do produto",
    example: ["cimento", "construção", "votoran"],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: "Tags devem ser um array" })
  @IsString({ each: true, message: "Cada tag deve ser uma string" })
  tags?: string[];

  @ApiProperty({
    description: "Atributos do produto",
    type: [ProductAttributeDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];

  @ApiProperty({
    description: "Variações do produto",
    type: [ProductVariationDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationDto)
  variations?: ProductVariationDto[];
}
