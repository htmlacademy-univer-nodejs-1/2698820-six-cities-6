import {IsEmail, IsEnum, IsOptional, IsString, Length} from 'class-validator';
import {USER_TYPES, type UserType} from '../../../types/entities.js';

export class CreateUserDto {
  @IsString()
  @Length(1, 15)
  public name!: string;

  @IsEmail()
  public email!: string;

  @IsOptional()
  @IsString()
  public avatarPath?: string;

  @IsString()
  @Length(6, 12)
  public password!: string;

  @IsEnum(USER_TYPES)
  public userType!: UserType;
}
