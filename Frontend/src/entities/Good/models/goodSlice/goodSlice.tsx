import { type GoodSchema } from 'entities/Good/models/types/GoodType'
import { createSlice } from '@reduxjs/toolkit'
import { fetchGoodById } from 'entities/Good/models/actions/fetchGoodById'

const initialState: GoodSchema = {
    isLoading: false,
    error: ''
}

const goodSlice = createSlice({
    name: 'good',
    initialState,
    reducers: {
    },

    extraReducers: (builder) => (
        builder.addCase(fetchGoodById.pending, (state) => {
            state.isLoading = true
        }),
        builder.addCase(fetchGoodById.fulfilled, (state, action) => {
            state.isLoading = false
            state.good = action.payload
        }),
        builder.addCase(fetchGoodById.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.error as string
        })

    )

})

export const goodReducer = goodSlice.reducer
