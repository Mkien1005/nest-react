import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async login(
    createAuthDto: CreateAuthDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password } = createAuthDto;
    if (!email || !password) {
      throw new UnauthorizedException('Missing data');
    }
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const payload = { sub: user.id, username: user.username };
      const access_token = await this.generateAccessToken(payload);
      const refresh_token = await this.generateRefreshToken(payload);
      user.refresh_token = refresh_token;
      await this.userService.update(user.id, user);
      return {
        access_token,
        refresh_token: user.refresh_token,
      };
    }
  }
  async register(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;
    if (!email || !password) {
      throw new BadRequestException('Missing data');
    }
    const user = await this.userService.findOneByEmail(email);
    if (user) {
      throw new BadRequestException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userService.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return { message: 'User registered successfully' };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(
        refreshToken,
        this.configService.get('JWT_SECRET_KEY'),
      );
      const user = await this.userService.findOneBy(
        payload.username,
        refreshToken,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const newAccessToken = await this.generateAccessToken({
        sub: payload.sub,
        username: payload.username,
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new BadRequestException('Invalid refresh token');
    }
  }
  async generateAccessToken(payload: { username: string; sub: string }) {
    return await this.jwtService.signAsync(payload, {
      expiresIn: '15m', // Access token hết hạn sau 15 phút
      secret: this.configService.get('JWT_SECRET_KEY'),
    });
  }

  async generateRefreshToken(payload: { username: string; sub: string }) {
    return await this.jwtService.signAsync(payload, {
      expiresIn: '7d', // Refresh token hết hạn sau 7 ngày
      secret: this.configService.get('JWT_SECRET_KEY'),
    });
  }
}
