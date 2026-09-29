import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsIn, IsNumber } from "class-validator";

export class AutoClassifyCatalogDto {
  @ApiProperty({
    description: "Modo de classificação: 'all' (todo o catálogo) ou 'unclassified_only' (apenas sem categoria)",
    example: "all",
    enum: ["all", "unclassified_only"],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(["all", "unclassified_only"])
  mode?: "all" | "unclassified_only";

  @ApiProperty({
    description: "Limite máximo de produtos para processar",
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
