import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { Cuisine } from '../enums/cuisine.enum'
import { Follower } from '../../users/schemas/follower.schema'

export type RestaurantDocument = HydratedDocument<Restaurant>

@Schema({ timestamps: true, versionKey: false })
export class Restaurant {
    @Prop({
        type: {
            ar: { type: String, required: true, trim: true },
            en: { type: String, required: true, trim: true },
        },
        required: true,
        _id: false,
    })
    name: { ar: string; en: string }

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    slug: string

    @Prop({
        type: [String],
        enum: Object.values(Cuisine),
        required: true,
        validate: {
            validator: (val: string[]) => val.length >= 1 && val.length <= 3,
            message: 'A restaurant must have between 1 and 3 cuisines.',
        },
    })
    cuisines: Cuisine[]

    @Prop({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
        },
    })
    location: {
        type: string
        coordinates: [number, number]
    }
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant)

RestaurantSchema.index({ location: '2dsphere' })

RestaurantSchema.set('toJSON', {
    transform: (_, ret) => {
        return {
            ...ret,
            location: {
                coordinates: ret.location.coordinates,
            },
        }
    },
})

RestaurantSchema.post(
    'findOneAndDelete',
    async function (doc: RestaurantDocument | null): Promise<void> {
        if (!doc) {
            return
        }

        const followerModel = this.model.db.model<Follower>('Follower')

        await followerModel.deleteMany({
            restaurantId: doc._id,
        })
    },
)
