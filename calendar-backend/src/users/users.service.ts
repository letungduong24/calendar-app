import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findOneByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    await this.usersRepository.update(id, updateData);
    const updatedUser = await this.findOneById(id);
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async findOrCreateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }): Promise<User> {
    let user = await this.findOneByGoogleId(googleUser.googleId);
    if (!user) {
      // Check if email already exists
      user = await this.findOneByEmail(googleUser.email);
      if (user) {
        // Link google account to existing user
        user.googleId = googleUser.googleId;
        user.avatar = googleUser.picture;
        return this.usersRepository.save(user);
      }
      
      // Create new user
      user = await this.create({
        email: googleUser.email,
        name: `${googleUser.firstName} ${googleUser.lastName}`,
        googleId: googleUser.googleId,
        avatar: googleUser.picture,
      });
    }
    return user;
  }

  async setCurrentRefreshToken(refreshToken: string, userId: number) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    const user = await this.findOneById(userId);
    if (!user || !user.refreshToken) return null;

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }
    return null;
  }

  async removeRefreshToken(userId: number) {
    return this.usersRepository.update(userId, {
      refreshToken: null as any,
    });
  }
}
