import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConvertQuoteToOrderDto {
  @ApiProperty({ description: 'Forma de pagamento', default: 'PIX' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // PIX, CREDIT_CARD, BOLETO, MONEY

  @ApiPropertyOptional({ description: 'Tipo de entrega', default: 'DELIVERY' })
  @IsString()
  @IsOptional()
  deliveryType?: string; // DELIVERY, PICKUP

  @ApiProperty({ description: 'Rua do endereço de entrega' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'Número do endereço de entrega' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiPropertyOptional({ description: 'Complemento do endereço' })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({ description: 'Bairro' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiPropertyOptional({ description: 'Cidade', default: 'Fortaleza' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado', default: 'CE' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Ponto de referência' })
  @IsString()
  @IsOptional()
  referencePoint?: string;
}
