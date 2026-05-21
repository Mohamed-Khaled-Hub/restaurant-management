import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsString,
    ArrayUnique,
} from 'class-validator'
import { Cuisine } from '../../restaurants/enums/cuisine.enum'

export class CreateUserDto {
    @IsString()
    @IsNotEmpty({ message: 'User full name is required' })
    fullName: string

    @IsArray()
    @IsEnum(Cuisine, { each: true, message: 'Invalid cuisine type provided' })
    @ArrayUnique({
        message: 'Favorite cuisines must not contain duplicate values',
    })
    favoriteCuisines: Cuisine[]
}
