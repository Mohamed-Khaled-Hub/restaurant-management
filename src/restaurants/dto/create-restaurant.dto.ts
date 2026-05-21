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
import { Type } from 'class-transformer'
import { Cuisine } from '../enums/cuisine.enum'

class LocalizedNameDto {
    @IsString()
    @IsNotEmpty()
    ar: string

    @IsString()
    @IsNotEmpty()
    en: string
}

class GeoLocationDto {
    @IsString()
    @Equals('Point')
    type: string

    @IsArray()
    @IsNumber({}, { each: true })
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    coordinates: number[]
}

export class CreateRestaurantDto {
    @ValidateNested()
    @Type(() => LocalizedNameDto)
    name: LocalizedNameDto

    @IsString()
    @IsNotEmpty()
    slug: string

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

    @ValidateNested()
    @Type(() => GeoLocationDto)
    location: GeoLocationDto
}
