import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types, QueryFilter } from 'mongoose'
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema'
import { Follower, FollowerDocument } from '../users/schemas/follower.schema'
import { UserDocument } from '../users/schemas/user.schema'
import { CreateRestaurantDto } from './dto/create-restaurant.dto'
import { UpdateRestaurantDto } from './dto/update-restaurant.dto'
import { Cuisine } from './enums/cuisine.enum'
import { RestaurantNearby } from './types/restaurant-nearby.type'

@Injectable()
export class RestaurantsService {
    constructor(
        @InjectModel(Restaurant.name)
        private readonly restaurantModel: Model<RestaurantDocument>,
        @InjectModel(Follower.name)
        private readonly followerModel: Model<FollowerDocument>,
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

    async findNearby(lng: number, lat: number): Promise<RestaurantNearby[]> {
        return this.restaurantModel
            .aggregate<RestaurantNearby>([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [lng, lat],
                        },
                        distanceField: 'distanceInMeters',
                        maxDistance: 1000,
                        spherical: true,
                    },
                },
                {
                    $addFields: {
                        distanceString: {
                            $cond: {
                                if: { $gte: ['$distanceInMeters', 1000] },
                                then: {
                                    $concat: [
                                        {
                                            $toString: {
                                                $round: [
                                                    {
                                                        $divide: [
                                                            '$distanceInMeters',
                                                            1000,
                                                        ],
                                                    },
                                                    2,
                                                ],
                                            },
                                        },
                                        ' km away',
                                    ],
                                },
                                else: {
                                    $concat: [
                                        {
                                            $toString: {
                                                $round: [
                                                    '$distanceInMeters',
                                                    0,
                                                ],
                                            },
                                        },
                                        ' meters away',
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        slug: 1,
                        cuisines: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        distanceInMeters: 1,
                        distanceString: 1,
                        location: {
                            coordinates: '$location.coordinates',
                        },
                    },
                },
            ])
            .exec()
    }

    async getFollowers(identifier: string): Promise<UserDocument[] | null> {
        const restaurant = await this.restaurantModel
            .findOne(this.getIdentifierQuery(identifier))
            .exec()

        if (!restaurant) {
            return null
        }

        return this.followerModel
            .aggregate<UserDocument>([
                {
                    $match: {
                        restaurantId: restaurant._id,
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $project: {
                        _id: '$user._id',
                        fullName: '$user.fullName',
                        favoriteCuisines: '$user.favoriteCuisines',
                        createdAt: '$user.createdAt',
                        updatedAt: '$user.updatedAt',
                    },
                },
            ])
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
