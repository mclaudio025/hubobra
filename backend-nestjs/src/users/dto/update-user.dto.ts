import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { UserRole } from "../../common/enums";

export class UpdateUserDto {
  @ApiProperty({
    description: "Nome completo do usuário",
    example: "João Silva",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Nome deve ser uma string" })
  name?: string;

  @ApiProperty({
    description: "Email do usuário",
    example: "joao@email.com",
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: "Email deve ter um formato válido" })
  email?: string;

  @ApiProperty({
    description: "Papel do usuário no sistema",
    enum: UserRole,
    example: UserRole.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: "Papel deve ser USER, ADMIN ou MANAGER" })
  role?: UserRole;

  @ApiProperty({
    description: "Status ativo do usuário",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "Active deve ser um boolean" })
  active?: boolean;
}
