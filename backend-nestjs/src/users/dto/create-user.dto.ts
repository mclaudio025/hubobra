import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
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
    example: UserRole.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: "Papel deve ser USER, ADMIN ou MANAGER" })
  role?: UserRole;
}
