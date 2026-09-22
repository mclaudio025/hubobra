import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUrl,
  IsDateString,
  Min,
} from "class-validator";

export class CreateBannerDto {
  @ApiProperty({
    description: "Título do banner",
    example: "Materiais de Construção",
  })
  @IsString({ message: "Título deve ser uma string" })
  @IsNotEmpty({ message: "Título é obrigatório" })
  title: string;

  @ApiProperty({
    description: "Subtítulo do banner",
    example: "Tudo para sua obra com qualidade",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Subtítulo deve ser uma string" })
  subtitle?: string;

  @ApiProperty({
    description: "Descrição do banner",
    example: "Encontre cimento, tijolos, telhas e muito mais",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Descrição deve ser uma string" })
  description?: string;

  @ApiProperty({
    description: "Texto do botão",
    example: "Ver Produtos",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Texto do botão deve ser uma string" })
  buttonText?: string;

  @ApiProperty({
    description: "Link do botão",
    example: "/produtos",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Link do botão deve ser uma string" })
  buttonLink?: string;

  @ApiProperty({
    description: "URL da imagem do banner",
    example: "https://example.com/banner.jpg",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "URL da imagem deve ser uma string" })
  imageUrl?: string;

  @ApiProperty({
    description: "Cor de fundo (classe CSS)",
    example: "from-orange-600 to-orange-700",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Cor de fundo deve ser uma string" })
  bgColor?: string;

  @ApiProperty({
    description: "Cor do texto (classe CSS)",
    example: "text-white",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Cor do texto deve ser uma string" })
  textColor?: string;

  @ApiProperty({
    description: "Tipo do banner",
    example: "HERO",
    enum: [
      "HERO",
      "PROMOTIONAL",
      "DEPARTMENT",
      "CATEGORY",
      "FEATURED",
      "SALE",
      "DISCOUNT",
      "NEWSLETTER",
      "TESTIMONIAL",
      "BRAND",
      "SEASONAL",
    ],
  })
  @IsString({ message: "Tipo deve ser uma string" })
  @IsNotEmpty({ message: "Tipo é obrigatório" })
  type: string;

  @ApiProperty({
    description: "Posição/ordem do banner",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Posição deve ser um número inteiro" })
  @Min(0, { message: "Posição deve ser maior ou igual a 0" })
  position?: number;

  @ApiProperty({
    description: "Se o banner está ativo",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "Active deve ser um boolean" })
  active?: boolean;

  @ApiProperty({
    description: "Data de início da exibição",
    example: "2024-01-01T00:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "Data de início deve ser uma data válida" })
  startDate?: string;

  @ApiProperty({
    description: "Data de fim da exibição",
    example: "2024-12-31T23:59:59Z",
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "Data de fim deve ser uma data válida" })
  endDate?: string;
}
