import {createReadStream, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import chalk from 'chalk';
import {type CreateOfferDto} from '../../modules/offer/offer-service.interface.js';
import {type OfferService} from '../../modules/offer/offer-service.interface.js';
import {type CreateUserDto, type UserService} from '../../modules/user/user-service.interface.js';
import {createContainer} from '../../shared/container.js';
import {type Config} from '../../shared/config/config.interface.js';
import {type DatabaseClient} from '../../shared/database/database-client.interface.js';
import {type Logger} from '../../shared/libs/logger/logger.interface.js';
import {Component} from '../../shared/types/component.js';
import {parseOfferLine} from '../utils/offer-tsv.js';

const DEFAULT_PASSWORD = '123456';

const resolveDbUri = (dbUriArg: string | undefined, config: Config): string =>
  dbUriArg ?? `mongodb://${config.get('DB_HOST')}:${config.get('DB_PORT')}/${config.get('DB_NAME')}`;

export const runImport = async (filepath?: string, dbUriArg?: string): Promise<void> => {
  if (!filepath) {
    console.error(chalk.red('Ошибка: не указан путь к TSV файлу.'));
    console.log(chalk.yellow('Пример: npm run cli -- --import ./mocks/offers.tsv mongodb://127.0.0.1:27017/six-cities'));
    process.exitCode = 1;
    return;
  }

  const absolutePath = resolve(filepath);
  if (!existsSync(absolutePath)) {
    console.error(chalk.red(`Ошибка: файл не найден: ${absolutePath}`));
    process.exitCode = 1;
    return;
  }

  const container = createContainer();
  const logger = container.get<Logger>(Component.Logger);
  const config = container.get<Config>(Component.Config);
  const dbClient = container.get<DatabaseClient>(Component.DatabaseClient);
  const userService = container.get<UserService>(Component.UserService);
  const offerService = container.get<OfferService>(Component.OfferService);
  const dbUri = resolveDbUri(dbUriArg, config);

  try {
    await dbClient.connect(dbUri);

    const stream = createReadStream(absolutePath, {encoding: 'utf8'});
    const reader = createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    let importedCount = 0;

    for await (const line of reader) {
      const preparedLine = line.trim();
      if (!preparedLine) {
        continue;
      }

      const parsedOffer = parseOfferLine(preparedLine, importedCount + 1);

      const createUserDto: CreateUserDto = {
        name: parsedOffer.author.name,
        email: parsedOffer.author.email,
        userType: parsedOffer.author.userType,
        password: DEFAULT_PASSWORD
      };

      const existingUser = await userService.findByEmail(createUserDto.email);
      const user = existingUser ?? await userService.create(createUserDto);

      const createOfferDto: CreateOfferDto = {
        title: parsedOffer.title,
        description: parsedOffer.description,
        publishDate: new Date(parsedOffer.publishDate),
        city: parsedOffer.city,
        previewImage: parsedOffer.previewImage,
        images: parsedOffer.images,
        isPremium: parsedOffer.isPremium,
        isFavorite: false,
        favoriteUserIds: parsedOffer.isFavorite ? [user._id] : [],
        rating: parsedOffer.rating,
        housingType: parsedOffer.housingType,
        roomsCount: parsedOffer.roomsCount,
        guestsCount: parsedOffer.guestsCount,
        rentalPrice: parsedOffer.rentalPrice,
        amenities: parsedOffer.amenities,
        authorId: user._id,
        commentsCount: parsedOffer.commentsCount
      };

      await offerService.create(createOfferDto);
      importedCount++;
    }

    logger.info(`Импорт завершён. Сохранено предложений: ${importedCount}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error(chalk.red(`Ошибка импорта: ${message}`));
    process.exitCode = 1;
  } finally {
    await dbClient.disconnect();
  }
};
