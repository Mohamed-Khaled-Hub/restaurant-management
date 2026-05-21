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
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBody,
} from '@nestjs/swagger'
import { Types } from 'mongoose'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserDocument } from './schemas/user.schema'
import { Cuisine } from '../restaurants/enums/cuisine.enum'
import { Recommendations } from './types/recommendations.type'
import { RestaurantDocument } from '../restaurants/schemas/restaurant.schema'

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @ApiOperation({
        summary: 'Create a new user',
        description: 'Creates a new user profile in the system.',
    })
    @ApiBody({
        type: CreateUserDto,
    })
    @ApiResponse({
        status: 201,
        description: 'User successfully created.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid request payload.',
    })
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
    @ApiOperation({
        summary: 'Get all users',
        description:
            'Retrieves all users. Can optionally filter by favorite cuisine.',
    })
    @ApiQuery({
        name: 'cuisine',
        required: false,
        enum: Cuisine,
        description: 'Filter users by favorite cuisine.',
    })
    @ApiResponse({
        status: 200,
        description: 'Users retrieved successfully.',
    })
    async findAll(@Query('cuisine') cuisine?: Cuisine) {
        return this.usersService.findAll(cuisine)
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get user by ID',
        description: 'Retrieves a single user by MongoDB ObjectId.',
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB User ObjectId',
        example: '6830bdb8c1d0f1c3a3a7f111',
    })
    @ApiResponse({
        status: 200,
        description: 'User retrieved successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid user ID format.',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found.',
    })
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
    @ApiOperation({
        summary: 'Update user',
        description: 'Updates an existing user profile.',
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB User ObjectId',
        example: '6830bdb8c1d0f1c3a3a7f111',
    })
    @ApiBody({
        type: UpdateUserDto,
    })
    @ApiResponse({
        status: 200,
        description: 'User updated successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid update payload or invalid ID.',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found.',
    })
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
    @ApiOperation({
        summary: 'Delete user',
        description: 'Deletes a user profile by ID.',
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB User ObjectId',
        example: '6830bdb8c1d0f1c3a3a7f111',
    })
    @ApiResponse({
        status: 200,
        description: 'User deleted successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid user ID.',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found.',
    })
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
    @ApiOperation({
        summary: 'Toggle follow restaurant',
        description: 'Allows a user to follow or unfollow a restaurant.',
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB User ObjectId',
        example: '6830bdb8c1d0f1c3a3a7f111',
    })
    @ApiParam({
        name: 'restaurantId',
        description: 'MongoDB Restaurant ObjectId',
        example: '6830bdb8c1d0f1c3a3a7f111',
    })
    @ApiResponse({
        status: 200,
        description: 'Follow state toggled successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid user or restaurant ID.',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found.',
    })
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
    @ApiOperation({
        summary: 'Get followed restaurants',
        description: 'Retrieves all restaurants followed by a specific user.',
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB User ObjectId',
        example: '6830bdb8c1d0f1c3a3a7f111',
    })
    @ApiResponse({
        status: 200,
        description: 'Followed restaurants retrieved successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid user ID.',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found.',
    })
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
    @ApiOperation({
        summary: 'Get restaurant recommendations',
        description:
            'Generates restaurant recommendations based on users with similar cuisine preferences.',
    })
    @ApiParam({
        name: 'id',
        description: 'MongoDB User ObjectId',
        example: '6830bdb8c1d0f1c3a3a7f111',
    })
    @ApiResponse({
        status: 200,
        description: 'Recommendations retrieved successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid user ID or recommendation engine failure.',
    })
    @ApiResponse({
        status: 404,
        description: 'User profile not found.',
    })
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
