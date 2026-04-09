import {Type} from 'class-transformer';
import {ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min, ValidateNested} from 'class-validator';
import {AMENITIES, CITY_NAMES, type Amenity, type CityName, HOUSING_TYPES, type HousingType, type Location} from '../../../types/entities.js';
import {CoordinatesDto} from './coordinates.dto.js';

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  @Length(10, 100)
  public title?: string;

  @IsOptional()
  @IsString()
  @Length(20, 1024)
  public description?: string;

  @IsOptional()
  @IsEnum(CITY_NAMES)
  public city?: CityName;

  @IsOptional()
  @IsString()
  public previewImage?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @IsString({each: true})
  public images?: [string, string, string, string, string, string];

  @IsOptional()
  @IsBoolean()
  public isPremium?: boolean;

  @IsOptional()
  @IsEnum(HOUSING_TYPES)
  public housingType?: HousingType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  public roomsCount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  public guestsCount?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(100000)
  public rentalPrice?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(AMENITIES, {each: true})
  public amenities?: Amenity[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  public coordinates?: Location;
}
