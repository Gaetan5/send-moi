import { IsString, IsNotEmpty, IsEnum, IsNumber, IsObject } from 'class-validator';
import { Category, City } from '@prisma/client';

export class CreateMissionDto {
  @IsEnum(Category)
  category: Category;

  @IsEnum(City)
  city: City;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsObject()
  categoryPayload: any;

  @IsNumber()
  priceAmount: number;
}
