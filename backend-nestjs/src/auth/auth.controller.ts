import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Login do usuário" })
  @ApiResponse({ status: 200, description: "Login realizado com sucesso" })
  @ApiResponse({ status: 401, description: "Credenciais inválidas" })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent");
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post("register")
  @ApiOperation({ summary: "Registro de novo usuário" })
  @ApiResponse({ status: 201, description: "Usuário criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Solicitar recuperação de senha" })
  @ApiResponse({ status: 200, description: "Código de recuperação gerado" })
  async forgotPassword(@Body("email") email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Redefinir senha do usuário" })
  @ApiResponse({ status: 200, description: "Senha redefinida com sucesso" })
  async resetPassword(
    @Body()
    resetDto: {
      email: string;
      code?: string;
      token?: string;
      newPassword: string;
    },
  ) {
    return this.authService.resetPassword(resetDto);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obter perfil do usuário logado" })
  @ApiResponse({ status: 200, description: "Perfil do usuário" })
  @ApiResponse({ status: 401, description: "Token inválido" })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post("validate")
  @ApiOperation({ summary: "Validar token JWT" })
  @ApiResponse({ status: 200, description: "Token válido" })
  @ApiResponse({ status: 401, description: "Token inválido" })
  async validateToken(@Body("token") token: string) {
    return this.authService.validateToken(token);
  }
}
