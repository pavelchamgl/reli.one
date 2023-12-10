import { createAsyncThunk } from '@reduxjs/toolkit'
import { type ThunkConfig } from 'app/providers/Redux/models/types/ReduxType'
import { API } from 'share/api/api'
import { BigCompanyForm } from '../type'


export const sendBigCompany = createAsyncThunk<void, BigCompanyForm, ThunkConfig<string>>('fetch/category', async (form, thunkAPI) => {
    const { rejectWithValue } = thunkAPI
    const api = new API().apiInstance
    try {
        const data = await api.post<void>(`contact/create/`, {
            email: form.email,
            address: form.address,
            company_name: form.company_name,
            message: form.message,
            phone: form.phone,
            name: form.name,
        })
        return data.data
    } catch (e) {
        return rejectWithValue('Something went wrong')
    }

})
