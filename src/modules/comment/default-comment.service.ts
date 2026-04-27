import {inject, injectable} from 'inversify';
import {type Types} from 'mongoose';
import {type OfferModel} from '../offer/offer.entity.js';
import {type CommentDocument, type CommentModel} from './comment.entity.js';
import {type CommentService, type CreateCommentDto} from './comment-service.interface.js';
import {Component} from '../../shared/types/component.js';

@injectable()
export class DefaultCommentService implements CommentService {
  constructor(
    @inject(Component.CommentModel) private readonly commentModel: CommentModel,
    @inject(Component.OfferModel) private readonly offerModel: OfferModel
  ) {}

  public async findById(id: string): Promise<CommentDocument | null> {
    return this.commentModel.findById(id).populate('authorId').exec();
  }

  public async findByOfferId(offerId: string, limit = 50): Promise<CommentDocument[]> {
    return this.commentModel
      .find({offerId})
      .populate('authorId')
      .sort({publishDate: -1})
      .limit(limit)
      .exec();
  }

  public async create(dto: CreateCommentDto): Promise<CommentDocument> {
    const comment = await this.commentModel.create({
      ...dto,
      publishDate: dto.publishDate ?? new Date()
    });

    const stats = await this.getOfferCommentsStats(comment.offerId);
    await this.offerModel.findByIdAndUpdate(comment.offerId, stats, {new: true}).exec();

    return comment.populate('authorId');
  }

  public async deleteByOfferId(offerId: Types.ObjectId | string): Promise<number> {
    const result = await this.commentModel.deleteMany({offerId}).exec();
    return result.deletedCount;
  }

  public async getOfferCommentsStats(offerId: Types.ObjectId | string): Promise<{commentsCount: number; rating: number}> {
    const [stats] = await this.commentModel.aggregate<{commentsCount: number; rating: number}>([
      {$match: {offerId}},
      {
        $group: {
          _id: '$offerId',
          commentsCount: {$sum: 1},
          rating: {$avg: '$rating'}
        }
      }
    ]);

    if (!stats) {
      return {
        commentsCount: 0,
        rating: 0
      };
    }

    return {
      commentsCount: stats.commentsCount,
      rating: Number(stats.rating.toFixed(1))
    };
  }
}
