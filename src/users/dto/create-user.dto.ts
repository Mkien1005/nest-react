import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  id: string;
  @IsNotEmpty()
  username: string;
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  password: string;
}
