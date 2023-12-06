import { configureStore, type ReducersMapObject } from '@reduxjs/toolkit'
import { userReducer } from 'entities/User'
import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { createReducerManager } from 'app/providers/Redux/store/reducerManager'
import { type Reducer, type CombinedState } from 'redux'
import { goodsPageReducer } from 'pages/GoodsPage'

export function ReduxSetUp (initialState?: GlobalScheme, asyncReducer?: ReducersMapObject<GlobalScheme>) {
    const Reducers: ReducersMapObject<GlobalScheme> = {
        ...asyncReducer,
        user: userReducer,
        goodsPage: goodsPageReducer
    }
    const reducerManager = createReducerManager(Reducers)
    const store = configureStore<GlobalScheme>({
        reducer: reducerManager.reduce as Reducer<CombinedState<GlobalScheme>>,
        devTools: __IS_DEV__,
        preloadedState: initialState
    })
    // @ts-expect-error
    store.reducerManager = reducerManager
    return store
}

export const store = ReduxSetUp()
export type AppDispatch = typeof store.dispatch
