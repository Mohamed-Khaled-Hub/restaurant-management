import 'dotenv/config'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { RestaurantsModule } from './restaurants/restaurants.module'
import { UsersModule } from './users/users.module'

const databaseUri = process.env.MONGODB_URI as string

@Module({
    imports: [
        MongooseModule.forRoot(databaseUri),
        RestaurantsModule,
        UsersModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
