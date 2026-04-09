import {Type} from 'class-transformer';
import {ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsString, Length, Max, Min, ValidateNested} from 'class-validator';
import {AMENITIES, CITY_NAMES, type Amenity, type CityName, HOUSING_TYPES, type HousingType, type Location} from '../../../types/entities.js';
import {CoordinatesDto} from './coordinates.dto.js';

export class CreateOfferDto {
  @IsString()
  @Length(10, 100)
  public title!: string;

  @IsString()
  @Length(20, 1024)
  public description!: string;

  @IsEnum(CITY_NAMES)
  public city!: CityName;

  @IsString()
  public previewImage!: string;

  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @IsString({each: true})
  public images!: [string, string, string, string, string, string];

  @IsBoolean()
  public isPremium!: boolean;

  @IsEnum(HOUSING_TYPES)
  public housingType!: HousingType;

  @IsInt()
  @Min(1)
  @Max(8)
  public roomsCount!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  public guestsCount!: number;

  @IsInt()
  @Min(100)
  @Max(100000)
  public rentalPrice!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(AMENITIES, {each: true})
  public amenities!: Amenity[];

  @ValidateNested()
  @Type(() => CoordinatesDto)
  public coordinates!: Location;
}
