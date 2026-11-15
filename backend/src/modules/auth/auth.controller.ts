import { Controller, Post, Body, UnauthorizedException, UseGuards, Get, Request, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  /**
   * Admin-only registration endpoint.
   * Only authenticated SUPER_ADMINs can create new user accounts.
   * This prevents public privilege escalation.
   */
  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async register(@Body() body: { email: string; password: string; firstName: string; lastName: string; role?: UserRole; vendorId?: string }) {
    // SUPER_ADMIN role can only be granted by another SUPER_ADMIN, and
    // only via the vendor onboarding flow — not through open registration.
    // Strip any attempt to self-assign SUPER_ADMIN here as extra safety.
    if (body.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN role cannot be assigned via registration. Use vendor onboarding.');
    }
    return this.authService.register(body);
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') token: string) {
    return this.authService.refreshToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: Record<string, unknown> }) {
    return req.user;
  }
}
