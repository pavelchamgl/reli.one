import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import mainInstance from "../api"

export const fetchWarehouseAnalytics = createAsyncThunk(
    "warehouse/fetchWarehouseAnalytics",
    async (_, { rejectWithValue }) => {
        try {
            const res = await mainInstance.get("/analytics/statistics/warehouses/?days=15");
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

const warehouseSlice = createSlice({
    name: "warehouse",
    initialState: {
        analytics: null,
        status: null,
        error: null
    },
    reducers: {

    },
    extraReducers: build => {
        build.addCase(fetchWarehouseAnalytics.pending, (state, action) => {
            state.status = "pending",
                state.analytics = action.payload,
                state.error = null
        })
        build.addCase(fetchWarehouseAnalytics.fulfilled, (state, action) => {
            state.status = "fulfilled",
                state.analytics = action.payload,
                state.error = null
        })
        build.addCase(fetchWarehouseAnalytics.rejected, (state, action) => {
            state.status = "rejected",
                state.error = action.payload
        })
    }
})

export const { } = warehouseSlice.actions
export const { reducer } = warehouseSlice