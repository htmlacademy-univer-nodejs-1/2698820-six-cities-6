import {inject, injectable} from 'inversify';
import {type UserDocument, type UserModel} from './user.entity.js';
import {type CreateUserDto, type UpdateUserDto, type UserService} from './user-service.interface.js';
import {Component} from '../../shared/types/component.js';

@injectable()
export class DefaultUserService implements UserService {
  constructor(@inject(Component.UserModel) private readonly userModel: UserModel) {}

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
    return this.userModel.create(dto);
  }

  public async updateById(id: string, dto: UpdateUserDto): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, dto, {new: true}).exec();
  }
}
