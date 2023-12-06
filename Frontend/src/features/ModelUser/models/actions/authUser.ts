import { createAsyncThunk } from '@reduxjs/toolkit'
import { ErrorAuth, type UserInfo } from '../types/AuthUserSchema'
import { type User } from 'entities/User/models/type/UserSchema'
import { AutoUser } from 'entities/User'
import { USER_COOKIES } from 'share/const/localstorage'
import { API } from 'share/api/api'
import { type ThunkConfig } from 'app/providers/Redux/models/types/ReduxType'
import { validateErrorAuth } from '../actions/validateErrorAuth'
import Cookies from 'js-cookie'

export const authUser = createAsyncThunk<User | string, UserInfo, ThunkConfig<ErrorAuth[]>>('auth/user', async (userFiled, thunkApi) => {
    const { dispatch, rejectWithValue } = thunkApi
    const api = new API().apiInstance
    const errors = validateErrorAuth(userFiled)
    if (errors.length) {
        return rejectWithValue(errors)
    }
    try {
        const data = await api.post<User>('accounts/signup/', { email: userFiled.email, password: userFiled.password, first_name: userFiled.name, last_name: userFiled.lastname })
        if (!data.data ) {
            throw new Error()
        }
        userFiled.close()
        userFiled.OpenModalLog()
        return data.data
    } catch (error) {
        errors.push(ErrorAuth.ERROR_SERVER)
        return rejectWithValue(errors)
    }
})
