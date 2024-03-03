import { createAsyncThunk } from '@reduxjs/toolkit'
import { ErrorsLog, type UserInfo } from '../types/AuthUserSchema'
import { type Token } from 'entities/User/models/type/UserSchema'
import { API } from 'share/api/api'
import { type ThunkConfig } from 'app/providers/Redux/models/types/ReduxType'
import { validateErrors } from './validateErrors'
import Cookies from 'js-cookie'
import { TOKEN_COOKIES } from 'share/const/localstorage'
import { userMe } from './userMe'

export const logUser = createAsyncThunk<Token | string, UserInfo, ThunkConfig<ErrorsLog[]>>('log/user', async (userFiled, thunkApi) => {
    const { dispatch, rejectWithValue } = thunkApi
    const api = new API().apiInstance
    const errors = validateErrors(userFiled)
    if (errors.length) {
        return rejectWithValue(errors)
    }
    try {
        const data_token = await api.post<Token>('accounts/login/', userFiled)
        Cookies.set(TOKEN_COOKIES, data_token.data.token)
        if (!data_token.data ) {
            throw new Error()
        }

        dispatch(userMe(userFiled.close))
        
        return data_token.data
    } catch (error) {
        errors.push(ErrorsLog.ERROR_SERVER)
        return rejectWithValue(errors)
    }
})
