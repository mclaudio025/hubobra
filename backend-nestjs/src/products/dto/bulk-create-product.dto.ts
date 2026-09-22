import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateProductDto } from "./create-product.dto";

export class BulkCreateProductDto {
  @ApiProperty({
    description: "Array de produtos para criação em massa",
    type: [CreateProductDto],
  })
  @IsArray({ message: "Products deve ser um array" })
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  products: CreateProductDto[];
}
