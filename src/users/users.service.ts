import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types, QueryFilter } from 'mongoose'
import { User, UserDocument } from './schemas/user.schema'
import { Follower, FollowerDocument } from './schemas/follower.schema'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { Cuisine } from '../restaurants/enums/cuisine.enum'
import { Recommendations } from './types/recommendations.type'
import { RestaurantDocument } from '../restaurants/schemas/restaurant.schema'

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectModel(Follower.name)
        private readonly followerModel: Model<FollowerDocument>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<UserDocument> {
        return new this.userModel(createUserDto).save()
    }

    async findAll(cuisine?: Cuisine): Promise<UserDocument[]> {
        const filter: QueryFilter<User> = cuisine
            ? { favoriteCuisines: cuisine }
            : {}

        return this.userModel.find(filter).exec()
    }

    async findOne(id: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ _id: id }).exec()
    }

    async update(
        id: string,
        updateUserDto: UpdateUserDto,
    ): Promise<UserDocument | null> {
        return this.userModel
            .findOneAndUpdate({ _id: id }, updateUserDto, {
                returnDocument: 'after',
                runValidators: true,
            })
            .exec()
    }

    async remove(id: string): Promise<UserDocument | null> {
        return this.userModel.findOneAndDelete({ _id: id }).exec()
    }

    async toggleFollowRestaurant(
        userId: string,
        restaurantId: string,
    ): Promise<{ followed: boolean } | null> {
        const targetUser = await this.userModel.findById(userId).exec()
        if (!targetUser) {
            return null
        }

        const followQuery: QueryFilter<Follower> = {
            userId: new Types.ObjectId(userId),
            restaurantId: new Types.ObjectId(restaurantId),
        }

        const existingFollow = await this.followerModel
            .findOne(followQuery)
            .exec()

        if (existingFollow) {
            await this.followerModel
                .deleteOne({ _id: existingFollow._id })
                .exec()
            return { followed: false }
        }

        await new this.followerModel({
            userId: new Types.ObjectId(userId),
            restaurantId: new Types.ObjectId(restaurantId),
        }).save()

        return { followed: true }
    }

    async getFollowedRestaurants(
        userId: string,
    ): Promise<RestaurantDocument[] | null> {
        const userExists = await this.userModel.exists({ _id: userId }).exec()
        if (!userExists) {
            return null
        }

        return this.followerModel
            .aggregate<RestaurantDocument>([
                { $match: { userId: new Types.ObjectId(userId) } },
                {
                    $lookup: {
                        from: 'restaurants',
                        localField: 'restaurantId',
                        foreignField: '_id',
                        as: 'restaurant',
                    },
                },
                { $unwind: '$restaurant' },
                {
                    $project: {
                        _id: '$restaurant._id',
                        name: '$restaurant.name',
                        slug: '$restaurant.slug',
                        cuisines: '$restaurant.cuisines',
                        location: {
                            coordinates: '$restaurant.location.coordinates',
                        },
                        createdAt: '$restaurant.createdAt',
                        updatedAt: '$restaurant.updatedAt',
                    },
                },
            ])
            .exec()
    }

    async getRestaurantRecommendations(
        userId: string,
    ): Promise<Recommendations | null> {
        const targetUser = await this.userModel.findById(userId).exec()

        if (!targetUser) {
            return null
        }

        if (!targetUser.favoriteCuisines?.length) {
            return { users: [], restaurants: [] }
        }

        return this.userModel
            .aggregate<Recommendations>([
                {
                    $match: {
                        _id: { $ne: targetUser._id },
                        favoriteCuisines: { $in: targetUser.favoriteCuisines },
                    },
                },
                {
                    $lookup: {
                        from: 'followers',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'follows',
                    },
                },
                {
                    $unwind: '$follows',
                },
                {
                    $lookup: {
                        from: 'restaurants',
                        localField: 'follows.restaurantId',
                        foreignField: '_id',
                        as: 'restaurant',
                    },
                },
                {
                    $unwind: '$restaurant',
                },
                {
                    $group: {
                        _id: null,
                        similarUsers: {
                            $addToSet: {
                                _id: '$_id',
                                fullName: '$fullName',
                                favoriteCuisines: '$favoriteCuisines',
                                createdAt: '$createdAt',
                                updatedAt: '$updatedAt',
                            },
                        },
                        restaurants: {
                            $addToSet: {
                                _id: '$restaurant._id',
                                name: '$restaurant.name',
                                slug: '$restaurant.slug',
                                cuisines: '$restaurant.cuisines',
                                location: {
                                    coordinates:
                                        '$restaurant.location.coordinates',
                                },
                                createdAt: '$restaurant.createdAt',
                                updatedAt: '$restaurant.updatedAt',
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        users: '$similarUsers',
                        restaurants: '$restaurants',
                    },
                },
            ])
            .exec()
            .then((result) => result[0] || { users: [], restaurants: [] })
    }
}
