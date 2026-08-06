import { IsString, IsNotEmpty, IsEnum, IsNumber, IsObject, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Category, City } from '@prisma/client';

export class MilestoneDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  percentage: number;
}

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];
}
