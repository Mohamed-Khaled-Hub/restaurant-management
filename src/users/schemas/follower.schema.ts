import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type FollowerDocument = HydratedDocument<Follower>

@Schema({
    timestamps: true,
    versionKey: false,
})
export class Follower {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId

    @Prop({
        type: Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    })
    restaurantId: Types.ObjectId
}

export const FollowerSchema = SchemaFactory.createForClass(Follower)

FollowerSchema.index({ userId: 1, restaurantId: 1 }, { unique: true })
