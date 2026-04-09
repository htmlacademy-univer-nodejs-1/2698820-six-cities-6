import {Expose, Type} from 'class-transformer';
import {UserRdo} from '../../user/rdo/user.rdo.js';

export class CommentRdo {
  @Expose({name: '_id'})
  public id!: string;

  @Expose()
  public text!: string;

  @Expose()
  public publishDate!: Date;

  @Expose()
  public rating!: number;

  @Expose({name: 'authorId'})
  @Type(() => UserRdo)
  public author!: UserRdo;
}
