import { RestaurantDocument } from '../schemas/restaurant.schema'

export interface RestaurantNearby extends RestaurantDocument {
    distanceInMeters: number
    distanceString: string
}
