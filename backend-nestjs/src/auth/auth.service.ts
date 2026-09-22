import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";

import { UsersService } from "../users/users.service";
import { SecurityAuditService } from "../security/security-audit.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private securityAuditService: SecurityAuditService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      // Log tentativa de login falhada
      await this.securityAuditService.logLoginAttempt(
        false,
        loginDto.email,
        ip || "unknown",
        userAgent,
      );
      throw new UnauthorizedException("Credenciais inválidas");
    }

    if (!user.active) {
      // Log tentativa de login com usuário inativo
      await this.securityAuditService.logLoginAttempt(
        false,
        loginDto.email,
        ip || "unknown",
        userAgent,
        user.id,
      );
      throw new UnauthorizedException("Usuário inativo");
    }

    // Log login bem-sucedido
    await this.securityAuditService.logLoginAttempt(
      true,
      loginDto.email,
      ip || "unknown",
      userAgent,
      user.id,
    );

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Verificar se usuário já existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException("Email já está em uso");
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Criar usuário
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Gerar token
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.active) {
        throw new UnauthorizedException("Token inválido");
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException("Token inválido");
    }
  }
}
