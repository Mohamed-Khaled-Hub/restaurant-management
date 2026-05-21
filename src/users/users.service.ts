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
                {
                    $match: {
                        userId: new Types.ObjectId(userId),
                    },
                },
                {
                    $lookup: {
                        from: 'restaurants',
                        localField: 'restaurantId',
                        foreignField: '_id',
                        as: 'restaurantDetails',
                    },
                },
                {
                    $unwind: '$restaurantDetails',
                },
                {
                    $project: {
                        _id: '$restaurantDetails._id',
                        name: '$restaurantDetails.name',
                        slug: '$restaurantDetails.slug',
                        cuisines: '$restaurantDetails.cuisines',
                        location: {
                            coordinates:
                                '$restaurantDetails.location.coordinates',
                        },
                        createdAt: '$restaurantDetails.createdAt',
                        updatedAt: '$restaurantDetails.updatedAt',
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

        if (
            !targetUser.favoriteCuisines ||
            targetUser.favoriteCuisines.length === 0
        ) {
            return { users: [], restaurants: [] }
        }

        const userObjectId = new Types.ObjectId(userId)

        const pipelineResult = await this.userModel
            .aggregate<Recommendations>([
                {
                    $match: {
                        _id: { $ne: userObjectId },
                        favoriteCuisines: { $in: targetUser.favoriteCuisines },
                    },
                },
                {
                    $group: {
                        _id: null,
                        similarUsers: {
                            $push: {
                                _id: '$_id',
                                fullName: '$fullName',
                                favoriteCuisines: '$favoriteCuisines',
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'followers',
                        localField: 'similarUsers._id',
                        foreignField: 'userId',
                        as: 'followedRelations',
                    },
                },
                {
                    $lookup: {
                        from: 'restaurants',
                        localField: 'followedRelations.restaurantId',
                        foreignField: '_id',
                        as: 'aggregatedRestaurants',
                    },
                },
                {
                    $project: {
                        _id: 0,
                        users: { $ifNull: ['$similarUsers', []] },
                        restaurants: {
                            $map: {
                                input: {
                                    $ifNull: ['$aggregatedRestaurants', []],
                                },
                                as: 'res',
                                in: {
                                    _id: '$$res._id',
                                    name: '$$res.name',
                                    slug: '$$res.slug',
                                    cuisines: '$$res.cuisines',
                                    location: {
                                        coordinates:
                                            '$$res.location.coordinates',
                                    },
                                    createdAt: '$$res.createdAt',
                                    updatedAt: '$$res.updatedAt',
                                },
                            },
                        },
                    },
                },
            ])
            .exec()

        return pipelineResult.length > 0
            ? pipelineResult[0]
            : { users: [], restaurants: [] }
    }
}
