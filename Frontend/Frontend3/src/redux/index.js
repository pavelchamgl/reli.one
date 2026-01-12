import { configureStore } from "@reduxjs/toolkit"
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web
import { combineReducers } from "@reduxjs/toolkit"


import { reducer as productsReducer } from "./productsSlice"
import { reducer as basketReducer } from "./basketSlice"
import { reducer as categoryReducer } from "./categorySlice"
import { reducer as commentReducer } from "./commentSlice"
import { reducer as paymentReducer } from "./paymentSlice"
import { reducer as favoriteReducer } from "./favoriteSlice"
import { reducer as ordersReducer } from "./ordersSlice"
import { reducer as createGoodsReducer } from "./createGoodsSlice"
import { reducer as craetePrev } from "./createProdPrevSlice"
import { reducer as editGoodsSlice } from "./editGoodsSlice"
import { reducer as warehouseSlice } from "./warehouseSlice"
import { reducer as sellerStaticsSlice } from "./sellerStaticsSlice"
import { reducer as sellerGoodsListSlice } from "./sellerGoodsListSlice"
import { reducer as selfEmploedSlice } from "./selfEmployed"


// Импорт

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['basket', 'payment', "selfEmploed"], // только эти слайсы сохраняются
}

const rootReducer = combineReducers({
    products: productsReducer,
    basket: basketReducer,
    category: categoryReducer,
    comment: commentReducer,
    payment: paymentReducer,
    favorites: favoriteReducer,
    orders: ordersReducer,
    create: createGoodsReducer,
    create_prev: craetePrev,
    edit_goods: editGoodsSlice,
    warehouse: warehouseSlice,
    seller_statics: sellerStaticsSlice,
    seller_goods: sellerGoodsListSlice,
    selfEmploed: selfEmploedSlice
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // отключаем проверки сериализуемости, иначе будет warning
        }),
})

export const persistor = persistStore(store)

// email - dastanalmazbekuulu9@gmail.com
// password - dastan555666$
