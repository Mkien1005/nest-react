import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { validate as isUuid } from 'uuid';
@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private users: Repository<User>) {}
  async create(createUserDto: CreateUserDto) {
    const user = await this.users.save(createUserDto);
    if (user) {
      delete user.password;
      return { message: 'User created successfully', user };
    } else {
      return { message: 'Failed to create user' };
    }
  }

  async findAll() {
    const users = await this.users.find();
    if (users.length > 0) {
      users.map((user) => {
        delete user.password;
        delete user.refresh_token;
      });
      return users;
    } else {
      return { message: 'No users found' };
    }
  }

  async findOne(id: string) {
    if (!isUuid(id)) {
      return { message: 'Invalid user ID' };
    }
    var user = await this.users.findOneBy({ id });
    if (user) {
      delete user.password;
      delete user.refresh_token;
      return user;
    } else {
      return { message: 'User not found' };
    }
  }
  async findOneBy(username: string, refresh_token: string) {
    var user = await this.users.findOneBy({ username, refresh_token });
    return user;
  }
  async findOneByEmail(email: string) {
    var user = await this.users.findOneBy({ email });
    return user;
  }
  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!isUuid(id)) {
      return { message: 'Invalid user ID' };
    }
    const user = await this.users.findOneBy({ id });
    if (user) {
      await this.users.save({ ...user, ...updateUserDto });
      delete user.password;
      return {
        message: 'User updated successfully',
        user: { ...user, ...updateUserDto },
      };
    } else {
      return { message: 'User not found' };
    }
  }

  async remove(id: string) {
    const user = await this.users.delete({ id });
    if (user.affected > 0) {
      return { message: 'User deleted successfully' };
    } else {
      return { message: 'User not found' };
    }
  }
}
