import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
} from "class-validator";
import { UserRole } from "../../common/enums";

export class CreateUserDto {
  @ApiProperty({
    description: "Nome completo do usuário",
    example: "João Silva",
  })
  @IsString({ message: "Nome deve ser uma string" })
  @IsNotEmpty({ message: "Nome é obrigatório" })
  name: string;

  @ApiProperty({
    description: "Email do usuário",
    example: "joao@email.com",
  })
  @IsEmail({}, { message: "Email deve ter um formato válido" })
  @IsNotEmpty({ message: "Email é obrigatório" })
  email: string;

  @ApiProperty({
    description: "Senha do usuário",
    example: "senha123",
    minLength: 6,
  })
  @IsString({ message: "Senha deve ser uma string" })
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(6, { message: "Senha deve ter pelo menos 6 caracteres" })
  password: string;

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

