import {
    createEntityAdapter,
    createSlice
} from '@reduxjs/toolkit'
import { type comment, type CommentSchema } from '../types/CommentSchema'
import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { fetchComments } from 'entities/Comments/models/actions/fetchComments'

const commentAdapter = createEntityAdapter<comment>({
    selectId: (comment) => comment.id
})

export const getComments = commentAdapter.getSelectors<GlobalScheme>((state) => state.comments || commentAdapter.getInitialState())

const commentSlice = createSlice({
    name: 'books',
    initialState: commentAdapter.getInitialState<CommentSchema>({
        ids: [],
        isLoading: false,
        error: undefined,
        entities: {
        }
    }),
    reducers: {
    },
    extraReducers: (builder) => (
        builder.addCase(fetchComments.pending, (state) => {
            state.isLoading = true
        }),
        builder.addCase(fetchComments.fulfilled, (state, action) => {
            state.isLoading = false
            commentAdapter.setAll(state, action.payload)
        }),
        builder.addCase(fetchComments.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.payload
        })

    )
})
export const commentReducer = commentSlice.reducer
