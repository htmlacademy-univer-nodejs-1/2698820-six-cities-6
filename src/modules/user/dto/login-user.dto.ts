import {IsEmail, IsString, Length} from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  public email!: string;

  @IsString()
  @Length(6, 12)
  public password!: string;
}
