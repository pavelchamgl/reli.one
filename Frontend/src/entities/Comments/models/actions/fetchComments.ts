import { createAsyncThunk } from '@reduxjs/toolkit'
import { type ThunkConfig } from 'app/providers/Redux/models/types/ReduxType'
import { API } from 'share/api/api'
import { type comment } from 'entities/Comments/models/types/CommentSchema'

export const fetchComments = createAsyncThunk<comment[], string, ThunkConfig<string>>('fetchByid/comment', async (id, thunkAPI) => {
    const { rejectWithValue } = thunkAPI
    const api = new API().apiInstance
    try {
        const data = await api.get<comment[]>(`/products/${id}/reviews/`)
        if (!data.data) {
            throw new Error()
        }
        return data.data
    } catch (e) {
        return rejectWithValue('Something went wrong')
    }

})
