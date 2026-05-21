import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { Cuisine } from '../../restaurants/enums/cuisine.enum'

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
