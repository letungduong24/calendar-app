import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Partial<User> | null> {
    console.log(`--- ĐANG KIỂM TRA ĐĂNG NHẬP CHO: ${email} ---`);
    const user = await this.usersService.findOneByEmail(email);
    
    if (!user) {
      console.log('=> KHÔNG TÌM THẤY USER');
      return null;
    }

    if (!user.password) {
      console.log('=> USER KHÔNG CÓ MẬT KHẨU (CÓ THỂ LÀ USER GOOGLE)');
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    console.log(`=> KẾT QUẢ SO SÁNH BCRYPT: ${isMatch}`);

    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: Partial<User> }> {
    const existingUser = await this.usersService.findOneByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email này đã được đăng ký');
    }

    const user = await this.usersService.create(registerDto);

    return this.login(user);
  }

  async login(user: User | Partial<User>): Promise<{ access_token: string; user: Partial<User> }> {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  async logout(userId: number) {
    // Không cần xóa refresh token nữa
  }

  async googleLogin(user: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }): Promise<{ access_token: string; user: Partial<User> }> {
    const dbUser = await this.usersService.findOrCreateGoogleUser(user);
    if (!dbUser) {
      throw new InternalServerErrorException('Không thể tìm thấy hoặc tạo người dùng từ Google');
    }
    return this.login(dbUser);
  }

  async googleLoginNative(idToken: string) {
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID'));

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new UnauthorizedException('Token Google không hợp lệ');
      }

      const user = await this.usersService.findOrCreateGoogleUser({
        googleId: payload.sub,
        email: payload.email!,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        picture: payload.picture || '',
      });

      return this.login(user);
    } catch (error) {
      console.error('Google Native Login Error:', error);
      throw new UnauthorizedException('Xác thực Google thất bại');
    }
  }
}
