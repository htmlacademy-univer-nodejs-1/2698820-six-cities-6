import mongoose, {Schema, type HydratedDocument, type InferSchemaType, type Model} from 'mongoose';

export const DEFAULT_AVATAR_PATH = '/static/default-avatar.png';

const UserSchema = new Schema(
  {
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    avatarPath: {type: String, default: DEFAULT_AVATAR_PATH},
    password: {type: String, required: true},
    userType: {type: String, required: true}
  },
  {
    timestamps: true
  }
);

export type UserEntity = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserEntity>;
export type UserModel = Model<UserEntity>;

export const createUserModel = (): UserModel => (mongoose.models.User as UserModel) || mongoose.model<UserEntity>('User', UserSchema);
