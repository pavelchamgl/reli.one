import { createAsyncThunk } from '@reduxjs/toolkit'
import { type ThunkConfig } from 'app/providers/Redux/models/types/ReduxType'
import { API } from 'share/api/api'
import { fetchComments } from 'entities/Comments/models/actions/fetchComments'
import { validateErrors } from './validateErrors'
import { type comment } from 'entities/Comments/models/types/CommentSchema'
import { type typeForActionAddComment, ErrorsComment } from '../types/AddCommentSchema'

export const createComment = createAsyncThunk<comment, typeForActionAddComment, ThunkConfig<ErrorsComment[]>>('create/comment', async (payload, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI
    const api = new API().apiInstance
    const errors = validateErrors(payload.text)
    if (errors.length) {
        return rejectWithValue(errors)
    }
    try {
        const data = await api.post<comment>(`/createReview/`, {
            content: payload.text,
            author: payload.author,
            product: payload.goodsId
        })
        if (!data.data) {
            throw new Error()
        }
        dispatch(fetchComments(payload.goodsId))
        return data.data
    } catch (e) {
        errors.push(ErrorsComment.SERVER_ERROR)
        return rejectWithValue(errors)
    }
})
