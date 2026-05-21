import { UserDocument } from '../schemas/user.schema'
import { RestaurantDocument } from '../../restaurants/schemas/restaurant.schema'

export interface Recommendations {
    users: UserDocument[]
    restaurants: RestaurantDocument[]
}
