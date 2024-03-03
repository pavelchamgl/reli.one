import {
    createEntityAdapter,
    createSlice
} from '@reduxjs/toolkit'
import { type Category, type CategorySchema } from '../models/type'
import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { fetchComments } from 'entities/Comments/models/actions/fetchComments'
import { fetchCategory } from './actions/fetchCategorys'


const initialState: CategorySchema ={
   isLoading: false,
   categorys: [],
   error: undefined
}
const categorySlice = createSlice({
    name: 'books',
    initialState: initialState,
    reducers: {
    },
    extraReducers: (builder) => (
        builder.addCase(fetchCategory.pending, (state) => {
            state.isLoading = true
        }),
        builder.addCase(fetchCategory.fulfilled, (state, action) => {
            state.isLoading = false
            state.categorys = action.payload
        }),
        builder.addCase(fetchCategory.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.payload
        })

    )
})
export const categoryReducer = categorySlice.reducer