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
import { RestaurantsService } from './restaurants.service'
import { CreateRestaurantDto } from './dto/create-restaurant.dto'
import { UpdateRestaurantDto } from './dto/update-restaurant.dto'
import { RestaurantDocument } from './schemas/restaurant.schema'
import { Cuisine } from './enums/cuisine.enum'

@Controller('restaurants')
export class RestaurantsController {
    constructor(private readonly restaurantsService: RestaurantsService) {}

    @Post()
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
    async findAll(@Query('cuisine') cuisine?: Cuisine) {
        return this.restaurantsService.findAll(cuisine)
    }

    @Get('nearby')
    async findNearby(@Query('lng') lng: string, @Query('lat') lat: string) {
        const longitude = Number(lng)
        const latitude = Number(lat)

        if (isNaN(longitude) || isNaN(latitude)) {
            throw new BadRequestException('Invalid coordinates provided.')
        }

        return this.restaurantsService.findNearby(longitude, latitude)
    }

    @Get(':identifier')
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
