import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { Cuisine } from '../../restaurants/enums/cuisine.enum'
import { Follower } from './follower.schema'

export type UserDocument = HydratedDocument<User>

@Schema({
    timestamps: true,
    versionKey: false,
})
export class User {
    @Prop({ required: true, trim: true })
    fullName: string

    @Prop({
        type: [String],
        enum: Object.values(Cuisine),
        default: [],
    })
    favoriteCuisines: Cuisine[]
}

export const UserSchema = SchemaFactory.createForClass(User)

UserSchema.post(
    'findOneAndDelete',
    async function (doc: UserDocument | null): Promise<void> {
        if (!doc) {
            return
        }

        const followerModel = this.model.db.model<Follower>('Follower')

        await followerModel.deleteMany({
            userId: doc._id,
        })
    },
)
