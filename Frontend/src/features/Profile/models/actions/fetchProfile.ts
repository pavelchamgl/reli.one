import { createAsyncThunk } from '@reduxjs/toolkit'
import { API } from 'share/api/api'
import { Profile } from '../types/ProfileType'


export const fetchProfile = createAsyncThunk<Profile, string>('profile/fetchProfile', async (id, thunkApi) => {
    const { rejectWithValue } = thunkApi
    const api = new API().apiInstance
    try {
        const data_user = await api.get<Profile>('accounts/users/me/')
        if (!data_user.data) {
            throw new Error()
        }
        return data_user.data
    } catch (e) {
      
        return rejectWithValue(Error)
    }
})
