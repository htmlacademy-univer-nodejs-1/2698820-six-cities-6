import {inject, injectable} from 'inversify';
import {type UserDocument, type UserModel} from './user.entity.js';
import {type CreateUserDto, type UpdateUserDto, type UserService} from './user-service.interface.js';
import {type Config} from '../../shared/config/config.interface.js';
import {createPasswordHash, verifyPassword} from '../../shared/helpers/password.js';
import {Component} from '../../shared/types/component.js';

@injectable()
export class DefaultUserService implements UserService {
  constructor(
    @inject(Component.UserModel) private readonly userModel: UserModel,
    @inject(Component.Config) private readonly config: Config
  ) {}

  public async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  public async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({email}).exec();
  }

  public async findFirst(): Promise<UserDocument | null> {
    return this.userModel.findOne().exec();
  }

  public async create(dto: CreateUserDto): Promise<UserDocument> {
    return this.userModel.create({
      ...dto,
      password: this.createPasswordHash(dto.password)
    });
  }

  public async updateById(id: string, dto: UpdateUserDto): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, this.prepareUpdateDto(dto), {new: true}).exec();
  }

  public async verifyUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    if (this.isPasswordValid(password, user.password)) {
      return user;
    }

    if (user.password === password) {
      user.password = this.createPasswordHash(password);
      await user.save();
      return user;
    }

    return null;
  }

  private createPasswordHash(password: string): string {
    return createPasswordHash(password, this.config.get('SALT'));
  }

  private isPasswordValid(password: string, hash: string): boolean {
    return verifyPassword(password, hash, this.config.get('SALT'));
  }

  private prepareUpdateDto(dto: UpdateUserDto): UpdateUserDto {
    if (!dto.password) {
      return dto;
    }

    return {
      ...dto,
      password: this.createPasswordHash(dto.password)
    };
  }
}
