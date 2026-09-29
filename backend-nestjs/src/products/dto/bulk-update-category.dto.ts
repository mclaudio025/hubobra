import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, IsNotEmpty } from "class-validator";

export class BulkUpdateCategoryDto {
  @ApiProperty({
    description: "Array de IDs dos produtos para atualizar categoria",
    type: [String],
    example: ["uuid-1", "uuid-2"],
  })
  @IsArray({ message: "productIds deve ser um array" })
  @IsString({ each: true, message: "Cada ID do produto deve ser uma string" })
  @IsNotEmpty({ message: "productIds não pode estar vazio" })
  productIds: string[];

  @ApiProperty({
    description: "ID da nova categoria para os produtos",
    example: "category-uuid",
  })
  @IsString({ message: "categoryId deve ser uma string" })
  @IsNotEmpty({ message: "categoryId é obrigatório" })
  categoryId: string;
}
