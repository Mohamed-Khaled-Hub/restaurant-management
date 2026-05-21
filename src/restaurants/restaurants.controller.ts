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
import { RestaurantsService } from './restaurants.service'
import { CreateRestaurantDto } from './dto/create-restaurant.dto'
import { UpdateRestaurantDto } from './dto/update-restaurant.dto'
import { RestaurantDocument } from './schemas/restaurant.schema'
import { UserDocument } from '../users/schemas/user.schema'
import { Cuisine } from './enums/cuisine.enum'

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
    constructor(private readonly restaurantsService: RestaurantsService) {}

    @Post()
    @ApiOperation({
        summary: 'Create restaurant',
        description: 'Creates a new restaurant profile.',
    })
    @ApiBody({
        type: CreateRestaurantDto,
    })
    @ApiResponse({
        status: 201,
        description: 'Restaurant successfully created.',
    })
    @ApiResponse({
        status: 400,
        description:
            'Failed to create restaurant due to invalid data or duplicate slug.',
    })
    async create(@Body() createRestaurantDto: CreateRestaurantDto) {
        try {
            return await this.restaurantsService.create(createRestaurantDto)
        } catch {
            throw new BadRequestException(
                'Failed to create restaurant. Ensure details or unique slug are correct.',
            )
        }
    }

    @Get()
    @ApiOperation({
        summary: 'Get all restaurants',
        description:
            'Retrieves all restaurants with optional cuisine filtering.',
    })
    @ApiQuery({
        name: 'cuisine',
        required: false,
        enum: Cuisine,
        description: 'Filter restaurants by cuisine type.',
    })
    @ApiResponse({
        status: 200,
        description: 'Restaurants retrieved successfully.',
    })
    async findAll(@Query('cuisine') cuisine?: Cuisine) {
        return this.restaurantsService.findAll(cuisine)
    }

    @Get('nearby')
    @ApiOperation({
        summary: 'Find nearby restaurants',
        description:
            'Returns restaurants sorted by proximity using geospatial queries.',
    })
    @ApiQuery({
        name: 'lng',
        required: true,
        type: Number,
        description: 'Longitude coordinate.',
        example: 31.2357,
    })
    @ApiQuery({
        name: 'lat',
        required: true,
        type: Number,
        description: 'Latitude coordinate.',
        example: 30.0444,
    })
    @ApiResponse({
        status: 200,
        description: 'Nearby restaurants retrieved successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid coordinates provided.',
    })
    async findNearby(@Query('lng') lng: string, @Query('lat') lat: string) {
        const longitude = Number(lng)
        const latitude = Number(lat)

        if (isNaN(longitude) || isNaN(latitude)) {
            throw new BadRequestException('Invalid coordinates provided.')
        }

        return this.restaurantsService.findNearby(longitude, latitude)
    }

    @Get(':identifier/followers')
    @ApiOperation({
        summary: 'Get followers of a restaurant',
        description:
            'Retrieves a list of users who follow the specified restaurant.',
    })
    @ApiParam({
        name: 'identifier',
        description: 'Restaurant MongoDB ObjectId or slug.',
        example: '6830bdb8c1d0f1c3a3a7f111 or pizza-queen',
    })
    @ApiResponse({
        status: 200,
        description: 'Followers list successfully compiled.',
    })
    @ApiResponse({
        status: 400,
        description: 'Failed to process followers lookup pipeline.',
    })
    @ApiResponse({
        status: 404,
        description: 'Target restaurant profile not found.',
    })
    async getFollowers(@Param('identifier') identifier: string) {
        let followers: UserDocument[] | null = null
        try {
            followers = await this.restaurantsService.getFollowers(identifier)
        } catch {
            throw new BadRequestException(
                'Failed to execute target restaurant followers lookup.',
            )
        }

        if (!followers) {
            throw new NotFoundException(
                'Restaurant profile not found with the provided ID or slug.',
            )
        }

        return followers
    }

    @Get(':identifier')
    @ApiOperation({
        summary: 'Get restaurant by identifier',
        description:
            'Retrieves a restaurant by MongoDB ObjectId or unique slug.',
    })
    @ApiParam({
        name: 'identifier',
        description: 'Restaurant MongoDB ObjectId or slug.',
        example: '6830bdb8c1d0f1c3a3a7f111 or pizza-queen',
    })
    @ApiResponse({
        status: 200,
        description: 'Restaurant retrieved successfully.',
    })
    @ApiResponse({
        status: 404,
        description: 'Restaurant not found.',
    })
    async findOne(@Param('identifier') identifier: string) {
        const restaurant = await this.restaurantsService.findOne(identifier)
        if (!restaurant) {
            throw new NotFoundException(
                'Restaurant not found with the provided ID or slug.',
            )
        }
        return restaurant
    }

    @Patch(':identifier')
    @ApiOperation({
        summary: 'Update restaurant',
        description: 'Updates restaurant information using ID or slug.',
    })
    @ApiParam({
        name: 'identifier',
        description: 'Restaurant MongoDB ObjectId or slug.',
        example: '6830bdb8c1d0f1c3a3a7f111 or pizza-queen',
    })
    @ApiBody({
        type: UpdateRestaurantDto,
    })
    @ApiResponse({
        status: 200,
        description: 'Restaurant updated successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid update payload.',
    })
    @ApiResponse({
        status: 404,
        description: 'Restaurant not found.',
    })
    async update(
        @Param('identifier') identifier: string,
        @Body() updateRestaurantDto: UpdateRestaurantDto,
    ) {
        let updatedRestaurant: RestaurantDocument | null = null

        try {
            updatedRestaurant = await this.restaurantsService.update(
                identifier,
                updateRestaurantDto,
            )
        } catch {
            throw new BadRequestException(
                'Failed to update restaurant. Verify input format.',
            )
        }

        if (!updatedRestaurant) {
            throw new NotFoundException('Restaurant not found to update.')
        }

        return updatedRestaurant
    }

    @Delete(':identifier')
    @ApiOperation({
        summary: 'Delete restaurant',
        description: 'Deletes a restaurant using MongoDB ObjectId or slug.',
    })
    @ApiParam({
        name: 'identifier',
        description: 'Restaurant MongoDB ObjectId or slug.',
        example: '6830bdb8c1d0f1c3a3a7f111 or pizza-queen',
    })
    @ApiResponse({
        status: 200,
        description: 'Restaurant deleted successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Deletion operation failed.',
    })
    @ApiResponse({
        status: 404,
        description: 'Restaurant not found.',
    })
    async remove(@Param('identifier') identifier: string) {
        let deletedRestaurant: RestaurantDocument | null = null

        try {
            deletedRestaurant = await this.restaurantsService.remove(identifier)
        } catch {
            throw new BadRequestException('Failed to delete restaurant.')
        }

        if (!deletedRestaurant) {
            throw new NotFoundException('Restaurant not found to delete.')
        }

        return { message: 'Restaurant successfully removed' }
    }
}
