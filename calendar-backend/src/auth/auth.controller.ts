import { Controller, Post, UseGuards, Request, Get, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: { user: User }, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req: { user: any; query: { state?: string } }, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    const redirectUrl = req.query.state;

    if (redirectUrl) {
      // For mobile app deep linking
      // Format: redirectUrl?token=ACCESS_TOKEN
      const urlWithToken = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}token=${result.access_token}`;
      return res.redirect(urlWithToken);
    }

    return res.json(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: { userId: number; email: string } }) {
    return req.user;
  }
}
