import { createAsyncThunk } from "@reduxjs/toolkit";
import { AutoUser } from "entities/User";
import { User } from "entities/User/models/type/UserSchema";
import { API } from 'share/api/api'
export const userMe = createAsyncThunk<User, () => void>('user/me', async (callback, thunkApi) => {
    const api = new API().apiInstance
    const {dispatch, rejectWithValue} = thunkApi
    try {
        const data_user = await api.get<User>('accounts/users/me/')
        dispatch(AutoUser(data_user.data))
        return data_user.data
    } catch (error) {
       return  rejectWithValue('')
    }
})