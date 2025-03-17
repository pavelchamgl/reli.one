import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import mainInstance from "../api"


export const fetchGetGoodsList = createAsyncThunk(
    "sellerGoodsList/fetchGetGoodsList",
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState().seller_goods;
            const res = await mainInstance.get(
                `/sellers/my-products/?max_price=${state.max}&min_price=${state.min}&ordering=${state.ordering}&page=${state.page}&page_size=${state.page_size}&search=${state.searchQuery}&status=${state.productStatus}`
            );
            console.log(res.data);

            return res.data; // Возвращаем данные при успешном запросе
            
        } catch (error) {
            if (!error.response) {
                // Ошибки сети или отсутствие ответа от сервера
                return rejectWithValue({ message: "Сервер недоступен. Проверьте соединение." });
            }

            const { status, data } = error.response;

            switch (status) {
                case 401:
                    return rejectWithValue({ message: "Ошибка авторизации. Пожалуйста, войдите заново." });
                case 403:
                    return rejectWithValue({ message: "У вас нет доступа к этим данным." });
                case 500:
                    return rejectWithValue({ message: "Внутренняя ошибка сервера. Попробуйте позже." });
                default:
                    return rejectWithValue({ message: data?.message || "Произошла ошибка. Попробуйте позже." });
            }
        }
    }
);






const sellerGoodsListSlise = createSlice({
    name: "sellerGoodsList",
    initialState: {
        products: [],
        product: {},
        status: null,
        error: null,
        max: 10000000,
        min: 0,
        ordering: "price",
        page: 1,
        page_size: 15,
        searchResult: [],
        searchQuery: "",
        productStatus: "approved",
        count: null
    },
    reducers: {
        setOrdering: (state, action) => {
            return {
                ...state, ordering: action.payload
            }
        },
        setMax: (state, action) => {
            return {
                ...state, max: action.payload
            }
        },
        setMin: (state, action) => {
            return {
                ...state, min: action.payload
            }
        },
        setProdPage: (state, action) => {
            return {
                ...state, page: action.payload
            }
        },
        setSearchQuery: (state, action) => {
            return {
                ...state, searchQuery: action.payload
            }
        },
        setStatus: (state, action) => {
            return {
                ...state, productStatus: action.payload
            }
        }
    },
    extraReducers: build => {
        build.addCase(fetchGetGoodsList.pending, (state, action) => {
            state.status = "pending",
                state.error = null,
                state.products = []
            state.count = null
        }),
            build.addCase(fetchGetGoodsList.fulfilled, (state, action) => {
                state.status = "fulfilled",
                    state.error = null,
                    state.products = action.payload.results
                state.count = action.payload.count
            }),
            build.addCase(fetchGetGoodsList.rejected, (state, action) => {
                state.status = "rejected",
                    state.error = action.payload,
                    state.products = []
                state.count = null
            })
    }
})

export const { setMax, setMin, setOrdering, setProdPage, setSearchQuery, setStatus } = sellerGoodsListSlise.actions
export const { reducer } = sellerGoodsListSlise