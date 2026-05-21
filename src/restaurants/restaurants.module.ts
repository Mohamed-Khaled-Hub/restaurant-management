import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { RestaurantsService } from './restaurants.service'
import { RestaurantsController } from './restaurants.controller'
import { Restaurant, RestaurantSchema } from './schemas/restaurant.schema'
import { Follower, FollowerSchema } from '../users/schemas/follower.schema'

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Restaurant.name, schema: RestaurantSchema },
            { name: Follower.name, schema: FollowerSchema },
        ]),
    ],
    controllers: [RestaurantsController],
    providers: [RestaurantsService],
})
export class RestaurantsModule {}
