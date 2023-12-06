import { createAsyncThunk } from '@reduxjs/toolkit'
import { type Good } from 'entities/Good/models/types/GoodType'
import { type ThunkConfig } from 'app/providers/Redux/models/types/ReduxType'
import { API } from 'share/api/api'

export const fetchGoodById = createAsyncThunk<Good, string, ThunkConfig<string>>('goood/fetch', async (id, thunkAPI) => {
    const { rejectWithValue } = thunkAPI
    const api = new API().apiInstance
    try {
        const data = await api.get<Good>(`/products/${id}`)
        if (!data.data) {
            throw new Error()
        }
        return data.data
    } catch (e) {
        return rejectWithValue(e)
    }
})
