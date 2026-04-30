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

  async register(registerDto: RegisterDto): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
    const existingUser = await this.usersService.findOneByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email này đã được đăng ký');
    }

    const user = await this.usersService.create(registerDto);

    return this.login(user);
  }

  async login(user: User | Partial<User>): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
    const payload = { email: user.email, sub: user.id };
    const refresh_token = this.jwtService.sign(payload, { 
      expiresIn: (this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d') as any 
    });

    if (user.id) {
      await this.usersService.setCurrentRefreshToken(refresh_token, user.id);
    }

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  async refresh(token: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.getUserIfRefreshTokenMatches(token, payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
      }

      const newPayload = { email: user.email, sub: user.id };
      const newRefreshToken = this.jwtService.sign(newPayload, { 
        expiresIn: (this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d') as any 
      });

      await this.usersService.setCurrentRefreshToken(newRefreshToken, user.id);

      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  async logout(userId: number) {
    await this.usersService.removeRefreshToken(userId);
  }

  async googleLogin(user: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
    const dbUser = await this.usersService.findOrCreateGoogleUser(user);
    if (!dbUser) {
      throw new InternalServerErrorException('Không thể tìm thấy hoặc tạo người dùng từ Google');
    }
    return this.login(dbUser);
  }
}
