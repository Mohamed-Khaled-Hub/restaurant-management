import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { Types } from 'mongoose'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserDocument } from './schemas/user.schema'
import { Cuisine } from '../restaurants/enums/cuisine.enum'
import { Recommendations } from './types/recommendations.type'
import { RestaurantDocument } from '../restaurants/schemas/restaurant.schema'

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        try {
            return await this.usersService.create(createUserDto)
        } catch {
            throw new BadRequestException(
                'Failed to create user. Ensure request input constraints are met.',
            )
        }
    }

    @Get()
    async findAll(@Query('cuisine') cuisine?: Cuisine) {
        return this.usersService.findAll(cuisine)
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid User ID format structure.')
        }

        let user: UserDocument | null = null
        try {
            user = await this.usersService.findOne(id)
        } catch {
            throw new BadRequestException(
                'Database query exception encountered.',
            )
        }

        if (!user) {
            throw new NotFoundException('User not found with the provided ID.')
        }
        return user
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid User ID format structure.')
        }

        let updatedUser: UserDocument | null = null
        try {
            updatedUser = await this.usersService.update(id, updateUserDto)
        } catch {
            throw new BadRequestException(
                'Failed to update user. Verify input format.',
            )
        }

        if (!updatedUser) {
            throw new NotFoundException('User not found to update.')
        }

        return updatedUser
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid User ID format structure.')
        }

        let deletedUser: UserDocument | null = null
        try {
            deletedUser = await this.usersService.remove(id)
        } catch {
            throw new BadRequestException('Failed to delete user.')
        }

        if (!deletedUser) {
            throw new NotFoundException('User not found to delete.')
        }

        return { message: 'User successfully removed' }
    }

    @Post(':id/follow/:restaurantId')
    async toggleFollow(
        @Param('id') id: string,
        @Param('restaurantId') restaurantId: string,
    ) {
        if (
            !Types.ObjectId.isValid(id) ||
            !Types.ObjectId.isValid(restaurantId)
        ) {
            throw new BadRequestException(
                'Invalid format structure for user or restaurant IDs.',
            )
        }

        let result: { followed: boolean } | null = null
        try {
            result = await this.usersService.toggleFollowRestaurant(
                id,
                restaurantId,
            )
        } catch {
            throw new BadRequestException(
                'Failed to execute follow interaction toggle.',
            )
        }

        if (!result) {
            throw new NotFoundException('Target user account not found.')
        }

        return {
            message: result.followed
                ? 'Successfully followed restaurant.'
                : 'Successfully unfollowed restaurant.',
            followed: result.followed,
        }
    }

    @Get(':id/followed-restaurants')
    async getFollowedRestaurants(@Param('id') id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid User ID format structure.')
        }

        let restaurants: RestaurantDocument[] | null = null
        try {
            restaurants = await this.usersService.getFollowedRestaurants(id)
        } catch {
            throw new BadRequestException(
                'Failed to fetch followed restaurants list.',
            )
        }

        if (restaurants === null) {
            throw new NotFoundException('User profile not found.')
        }

        return restaurants
    }

    @Get(':id/recommendations')
    async getRecommendations(@Param('id') id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid user ID format.')
        }

        let recommendations: Recommendations | null = null
        try {
            recommendations =
                await this.usersService.getRestaurantRecommendations(id)
        } catch {
            throw new BadRequestException(
                'Failed to process recommendation engine pipeline.',
            )
        }

        if (!recommendations) {
            throw new NotFoundException('User profile not found.')
        }

        return recommendations
    }
}
