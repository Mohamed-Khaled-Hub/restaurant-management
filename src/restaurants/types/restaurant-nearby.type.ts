import { RestaurantDocument } from '../schemas/restaurant.schema'

export interface RestaurantNearby extends Omit<
    RestaurantDocument,
    'toObject' | 'toJSON'
> {
    distanceInMeters: number
    distanceString: string
}
