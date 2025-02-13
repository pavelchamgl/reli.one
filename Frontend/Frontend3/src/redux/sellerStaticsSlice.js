import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import mainInstance from "../api"


export const fetchSellerStatics = createAsyncThunk(
    "sellerStatics/fetchSellerStatics",
    async (_, { rejectWithValue }) => {
        try {
            const res = await mainInstance.get("/sellers/statistics/sales/?days=15");
            console.log(res.data);

            return res.data; // Возвращаем данные при успешном запросе
        } catch (error) {
            // Логируем ошибку для отладки
            console.error("Ошибка при запросе аналитики складов:", error);

            // Обработка ошибки 401 (Unauthorized)
            if (error.response?.status === 401) {
                // Например, перенаправление на страницу авторизации
                return rejectWithValue({
                    message: "Сессия истекла. Пожалуйста, войдите снова.",
                    status: 401,
                });
            }

            // Обработка ошибки 500 (Internal Server Error)
            if (error.response?.status === 500) {
                return rejectWithValue({
                    message: "Ошибка на сервере. Пожалуйста, попробуйте позже.",
                    status: 500,
                });
            }

            // Обработка других ошибок
            return rejectWithValue({
                message: error.response?.data?.message || "Произошла ошибка при загрузке данных",
                status: error.response?.status || 500,
            });
        }
    }
);


const sellerStaticsSlise = createSlice({
    name: "sellerStatics",
    initialState: {
        statics: null,
        status: null,
        error: null
    },
    reducers: {

    },
    extraReducers: build => {
        build.addCase(fetchSellerStatics.pending, (state, action) => {
            state.status = "pending",
                state.statics = action.payload,
                state.error = null
        }),
            build.addCase(fetchSellerStatics.fulfilled, (state, action) => {
                state.status = "fulfilled",
                    state.statics = action.payload,
                    state.error = null
            }),

            build.addCase(fetchSellerStatics.rejected, (state, action) => {
                state.status = "rejected",
                    state.error = action.payload
            })
    }
})

export const { } = sellerStaticsSlise.actions
export const { reducer } = sellerStaticsSlise