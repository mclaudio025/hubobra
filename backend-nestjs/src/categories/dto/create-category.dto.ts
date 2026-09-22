import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  MaxLength,
  IsUUID,
} from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({
    description: "Nome da categoria",
    example: "Cimento e Argamassa",
  })
  @IsString({ message: "Nome deve ser uma string" })
  @IsNotEmpty({ message: "Nome é obrigatório" })
  @MaxLength(100, { message: "Nome deve ter no máximo 100 caracteres" })
  name: string;

  @ApiProperty({
    description: "Descrição da categoria",
    example:
      "Produtos para construção civil como cimentos, argamassas e aditivos",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Descrição deve ser uma string" })
  description?: string;

  @ApiProperty({
    description: "URL da imagem da categoria",
    example: "https://example.com/categoria.jpg",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Imagem deve ser uma string" })
  image?: string;

  @ApiProperty({
    description: "Ícone da categoria (classe CSS ou nome)",
    example: "fas fa-hammer",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Ícone deve ser uma string" })
  icon?: string;

  @ApiProperty({
    description: "Ordem de exibição da categoria",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Ordem deve ser um número" })
  order?: number;

  @ApiProperty({
    description: "ID da categoria pai (para subcategorias)",
    example: "uuid-da-categoria-pai",
    required: false,
  })
  @IsOptional()
  @IsUUID("4", { message: "Parent ID deve ser um UUID válido" })
  parentId?: string;

  @ApiProperty({
    description: "Se a categoria está ativa",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "Active deve ser um boolean" })
  active?: boolean;
}
