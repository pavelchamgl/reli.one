import { configureStore } from "@reduxjs/toolkit"
import { reducer as productsReducer } from "./productsSlice"
import { reducer as basketReducer } from "./basketSlice"
import { reducer as categoryReducer } from "./categorySlice"
import { reducer as commentReducer } from "./commentSlice"
import { reducer as paymentReducer } from "./paymentSlice"
import { reducer as favoriteReducer } from "./favoriteSlice"
import { reducer as ordersReducer } from "./ordersSlice"

export default configureStore({
    reducer: {
        products: productsReducer,
        basket: basketReducer,
        category: categoryReducer,
        comment: commentReducer,
        payment: paymentReducer,
        favorites: favoriteReducer,
        orders: ordersReducer
    }
})

// email - dastanalmazbekuulu9@gmail.com
// password - dastan555666$

// python3 manage.py createsuperuser - создание админки

// docker-compose up -d