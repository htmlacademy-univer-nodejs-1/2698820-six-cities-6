export const Component = {
  Application: Symbol('Application'),
  Logger: Symbol('Logger'),
  Config: Symbol('Config'),
  DatabaseClient: Symbol('DatabaseClient'),
  UserModel: Symbol('UserModel'),
  OfferModel: Symbol('OfferModel'),
  CommentModel: Symbol('CommentModel'),
  UserService: Symbol('UserService'),
  OfferService: Symbol('OfferService'),
  CommentService: Symbol('CommentService'),
  UserController: Symbol('UserController'),
  OfferController: Symbol('OfferController'),
  CommentController: Symbol('CommentController'),
  ExceptionFilter: Symbol('ExceptionFilter')
} as const;
