import { configureStore } from "@reduxjs/toolkit"
import { reducer as productsReducer } from "./productsSlice"
import { reducer as basketReducer } from "./basketSlice"
import { reducer as categoryReducer } from "./categorySlice"
import { reducer as commentReducer } from "./commentSlice"
import { reducer as paymentReducer } from "./paymentSlice"
import { reducer as favoriteReducer } from "./favoriteSlice"
import { reducer as ordersReducer } from "./ordersSlice"
import { reducer as createGoodsReducer } from "./createGoodsSlice"

export default configureStore({
    reducer: {
        products: productsReducer,
        basket: basketReducer,
        category: categoryReducer,
        comment: commentReducer,
        payment: paymentReducer,
        favorites: favoriteReducer,
        orders: ordersReducer,
        create: createGoodsReducer
    }
})

// email - dastanalmazbekuulu9@gmail.com
// password - dastan555666$
