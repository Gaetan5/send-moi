import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsObject } from 'class-validator';
import { Category, City } from '@prisma/client';

export class CreateMissionDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

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

  @IsNumber()
  @IsOptional()
  fixedFee?: number;

  @IsNumber()
  @IsOptional()
  commissionRate?: number;
}
