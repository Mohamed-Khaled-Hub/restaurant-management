import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types, QueryFilter } from 'mongoose'
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema'
import { CreateRestaurantDto } from './dto/create-restaurant.dto'
import { UpdateRestaurantDto } from './dto/update-restaurant.dto'
import { Cuisine } from './enums/cuisine.enum'

@Injectable()
export class RestaurantsService {
    constructor(
        @InjectModel(Restaurant.name)
        private readonly restaurantModel: Model<RestaurantDocument>,
    ) {}

    private getIdentifierQuery(identifier: string): QueryFilter<Restaurant> {
        const isId = Types.ObjectId.isValid(identifier)
        return isId ? { _id: identifier } : { slug: identifier.toLowerCase() }
    }

    async create(
        createRestaurantDto: CreateRestaurantDto,
    ): Promise<RestaurantDocument> {
        return new this.restaurantModel(createRestaurantDto).save()
    }

    async findAll(cuisine?: Cuisine): Promise<RestaurantDocument[]> {
        const filter: QueryFilter<Restaurant> = cuisine
            ? { cuisines: cuisine }
            : {}

        return this.restaurantModel.find(filter).exec()
    }

    async findOne(identifier: string): Promise<RestaurantDocument | null> {
        return this.restaurantModel
            .findOne(this.getIdentifierQuery(identifier))
            .exec()
    }

    async findNearby(lng: number, lat: number): Promise<RestaurantDocument[]> {
        return this.restaurantModel
            .find({
                location: {
                    $geoWithin: {
                        $centerSphere: [[lng, lat], 1 / 6378.1],
                    },
                },
            })
            .exec()
    }

    async update(
        identifier: string,
        updateRestaurantDto: UpdateRestaurantDto,
    ): Promise<RestaurantDocument | null> {
        return this.restaurantModel
            .findOneAndUpdate(
                this.getIdentifierQuery(identifier),
                updateRestaurantDto,
                {
                    returnDocument: 'after',
                    runValidators: true,
                },
            )
            .exec()
    }

    async remove(identifier: string): Promise<RestaurantDocument | null> {
        return this.restaurantModel
            .findOneAndDelete(this.getIdentifierQuery(identifier))
            .exec()
    }
}
