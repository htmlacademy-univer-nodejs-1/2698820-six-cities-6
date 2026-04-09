import {IsLatitude, IsLongitude} from 'class-validator';

export class CoordinatesDto {
  @IsLatitude()
  public latitude!: number;

  @IsLongitude()
  public longitude!: number;
}
