import { type AddCommentSchema, type ErrorsComment } from '../types/AddCommentSchema'
import { createSlice } from '@reduxjs/toolkit'
import { type PayloadAction } from '@reduxjs/toolkit/dist/createAction'
import { createComment } from 'features/AddComment/models/actions/createComment'

const initialState: AddCommentSchema = {
    isLoading: false,
    error: undefined,
    text: ''
}

const addCommentSlice = createSlice({
    name: 'addComment',
    initialState,
    reducers: {
        setText (state, action: PayloadAction<string>) {
            state.text = action.payload
        }
    },
    extraReducers: (builder) => (
        builder.addCase(createComment.pending, (state, action) => {
            state.isLoading = true
        }),
        builder.addCase(createComment.fulfilled, (state, action) => {
            state.isLoading = false
            state.text = ''
        }),
        builder.addCase(createComment.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.payload
        })
    )
})

export const addCommentReducer = addCommentSlice.reducer
export const { setText } = addCommentSlice.actions
