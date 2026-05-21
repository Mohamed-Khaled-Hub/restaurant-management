import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsString,
    ArrayUnique,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Cuisine } from '../../restaurants/enums/cuisine.enum'

export class CreateUserDto {
    @ApiProperty({
        example: 'Mohamed Khaled',
        description: 'Full name of the user',
    })
    @IsString()
    @IsNotEmpty({ message: 'User full name is required' })
    fullName: string

    @ApiProperty({
        enum: Cuisine,
        isArray: true,
        example: Object.values(Cuisine),
        description: 'User favorite cuisines',
    })
    @IsArray()
    @IsEnum(Cuisine, { each: true, message: 'Invalid cuisine type provided' })
    @ArrayUnique({
        message: 'Favorite cuisines must not contain duplicate values',
    })
    favoriteCuisines: Cuisine[]
}
