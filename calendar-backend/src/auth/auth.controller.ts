import { Controller, Post, UseGuards, Request, Get, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';
import type { Response } from 'express';

import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

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
    
    console.log(`--- GOOGLE CALLBACK ---`);
    console.log(`=> Redirect URL từ State: ${redirectUrl}`);

    if (redirectUrl) {
      // For mobile app deep linking - matching new store naming
      const urlWithToken = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}accessToken=${result.access_token}&refreshToken=${result.refresh_token}`;
      console.log(`=> Đang Redirect về: ${urlWithToken}`);
      return res.redirect(urlWithToken);
    }

    return res.json(result);
  }

  @Post('google/signin')
  async googleSigninNative(@Body('idToken') idToken: string) {
    return this.authService.googleLoginNative(idToken);
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    console.log(`--- REFRESH REQUEST RECEIVED ---`);
    console.log(`=> Token: ${refreshToken ? (refreshToken.substring(0, 20) + '...') : 'NULL'}`);
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: { user: { userId: number; email: string } }) {
    const user = await this.usersService.findOneById(req.user.userId);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: { user: { userId: number } }) {
    await this.authService.logout(req.user.userId);
    return { message: 'Đăng xuất thành công' };
  }
}
