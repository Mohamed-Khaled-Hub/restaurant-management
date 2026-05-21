import {
    IsString,
    IsNotEmpty,
    IsArray,
    IsEnum,
    ArrayMinSize,
    ArrayMaxSize,
    IsNumber,
    ValidateNested,
    Equals,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { Cuisine } from '../enums/cuisine.enum'

class LocalizedNameDto {
    @ApiProperty({
        example: 'بيتزا كوين',
        description: 'Arabic restaurant name',
    })
    @IsString()
    @IsNotEmpty()
    ar: string

    @ApiProperty({
        example: 'Pizza Queen',
        description: 'English restaurant name',
    })
    @IsString()
    @IsNotEmpty()
    en: string
}

class GeoLocationDto {
    @ApiProperty({
        example: 'Point',
        enum: ['Point'],
        description: 'GeoJSON type required for 2dsphere indexing',
    })
    @IsString()
    @Equals('Point')
    type: string

    @ApiProperty({
        example: [31.2357, 30.0444],
        description: 'GeoJSON coordinates in [longitude, latitude] format',
        type: [Number],
    })
    @IsArray()
    @IsNumber({}, { each: true })
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    coordinates: number[]
}

export class CreateRestaurantDto {
    @ApiProperty({
        type: LocalizedNameDto,
        description: 'Localized restaurant names',
    })
    @ValidateNested()
    @Type(() => LocalizedNameDto)
    name: LocalizedNameDto

    @ApiProperty({
        example: 'pizza-queen',
        description: 'Unique restaurant slug',
    })
    @IsString()
    @IsNotEmpty()
    slug: string

    @ApiProperty({
        enum: Cuisine,
        isArray: true,
        example: [Cuisine.PIZZA, Cuisine.PASTA],
        description: 'Restaurant cuisine categories',
    })
    @IsArray()
    @IsEnum(Cuisine, {
        each: true,
        message: `Cuisines must be valid options: ${Object.values(Cuisine).join(', ')}`,
    })
    @ArrayMinSize(1)
    @ArrayMaxSize(3, {
        message: 'A restaurant can have between 1 to 3 cuisines maximum.',
    })
    cuisines: Cuisine[]

    @ApiProperty({
        type: GeoLocationDto,
        description: 'Restaurant geographical location',
    })
    @ValidateNested()
    @Type(() => GeoLocationDto)
    location: GeoLocationDto
}
