import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateOrderItemDto {
  @ApiProperty({ description: "ID do produto" })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: "Quantidade do produto" })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: "Preço unitário do produto" })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateShippingAddressDto {
  @ApiProperty({ description: "Rua/Avenida" })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: "Número" })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ description: "Complemento", required: false })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ description: "Bairro" })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ description: "Cidade" })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: "Estado" })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: "CEP" })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({ description: "País", default: "Brasil" })
  @IsOptional()
  @IsString()
  country?: string;
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  PIX = "PIX",
  BANK_SLIP = "BANK_SLIP",
  CASH = "CASH",
}

export class CreatePaymentDto {
  @ApiProperty({ description: "Método de pagamento", enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: "Valor do pagamento" })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: "ID da transação", required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: "Itens do pedido", type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({
    description: "Endereço de entrega",
    type: CreateShippingAddressDto,
  })
  @ValidateNested()
  @Type(() => CreateShippingAddressDto)
  shippingAddress: CreateShippingAddressDto;

  @ApiProperty({ description: "Dados de pagamento", type: CreatePaymentDto })
  @ValidateNested()
  @Type(() => CreatePaymentDto)
  payment: CreatePaymentDto;

  @ApiProperty({ description: "Método de entrega", required: false })
  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @ApiProperty({ description: "Observações do pedido", required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: "Valor do frete" })
  @IsNumber()
  @Min(0)
  shipping: number;

  @ApiProperty({ description: "Valor dos impostos" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;
}
