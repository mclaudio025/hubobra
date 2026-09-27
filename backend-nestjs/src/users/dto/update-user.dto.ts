import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
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
    description: "Nova senha do usuário",
    example: "novaSenha123",
    required: false,
    minLength: 6,
  })
  @IsOptional()
  @IsString({ message: "Senha deve ser uma string" })
  @MinLength(6, { message: "Senha deve ter pelo menos 6 caracteres" })
  password?: string;

  @ApiProperty({
    description: "Papel do usuário no sistema",
    enum: UserRole,
    example: UserRole.EXPEDITION,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: "Papel deve ser USER, ADMIN, MANAGER ou EXPEDITION" })
  role?: UserRole;

  @ApiProperty({
    description: "Status ativo do usuário",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "Active deve ser um boolean" })
  active?: boolean;

  @ApiProperty({
    description: "Telefone do usuário",
    example: "(85) 99999-9999",
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

