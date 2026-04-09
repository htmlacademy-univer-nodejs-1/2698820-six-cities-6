import {type CrudService} from '../../shared/types/crud-service.interface.js';
import {type UserDocument, type UserEntity} from './user.entity.js';

export type CreateUserDto = Pick<UserEntity, 'name' | 'email' | 'avatarPath' | 'password' | 'userType'>;
export type UpdateUserDto = Partial<Pick<UserEntity, 'avatarPath' | 'name' | 'password' | 'userType'>>;

export interface UserService extends CrudService<UserDocument, CreateUserDto> {
  findByEmail(email: string): Promise<UserDocument | null>;
  findFirst(): Promise<UserDocument | null>;
  updateById(id: string, dto: UpdateUserDto): Promise<UserDocument | null>;
}
