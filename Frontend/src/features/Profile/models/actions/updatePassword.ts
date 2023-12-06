import { createAsyncThunk } from '@reduxjs/toolkit'
import { ErrorsPasswordUpdate } from '../types/ProfileType'
import { API } from 'share/api/api'
import { type ThunkConfig } from 'app/providers/Redux/models/types/ReduxType'
import { validateError } from 'features/Profile/models/actions/validateError'


export const updatePassword = createAsyncThunk<string, string, ThunkConfig<ErrorsPasswordUpdate[] | ErrorsPasswordUpdate>>('update/Profile', async (password, thunkAPI) => {
    const { rejectWithValue } = thunkAPI
    const api = new API().apiInstance
    const errors = validateError(password)
    if (errors.length) {
        return rejectWithValue(errors)
    }
    try {
        const data = await api.post<string>('accounts/password/change/', {
            password: password
        })
        return data.data
    } catch (e) {
        errors.push(ErrorsPasswordUpdate.ERROR_SERVER)
        return rejectWithValue(errors)
    }
})
