import {type Types} from 'mongoose';
import {type CrudService} from '../../shared/types/crud-service.interface.js';
import {type CommentDocument, type CommentEntity} from './comment.entity.js';

export type CreateCommentDto = Pick<CommentEntity, 'text' | 'rating' | 'offerId' | 'authorId'> & {
  publishDate?: Date;
};

export interface CommentService extends CrudService<CommentDocument, CreateCommentDto> {
  findByOfferId(offerId: string, limit?: number): Promise<CommentDocument[]>;
  deleteByOfferId(offerId: Types.ObjectId | string): Promise<number>;
  getOfferCommentsStats(offerId: Types.ObjectId | string): Promise<{commentsCount: number; rating: number}>;
}
