import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getProductById, getProducts } from "../api/productsApi"
import axios from "axios";
import mainInstance from "../api";

const token = JSON.parse(localStorage.getItem("token"));

export const fetchGetProducts = createAsyncThunk(
    "products/fetchGetProducts",
    async (_, { rejectWithValue, getState }) => {
        try {
            const state = getState().products
            console.log(state);
            const res = await axios.get(`https://reli.one/api/products/categories/${state.category}/?max_price=${state.max}&min_price=${state.min}&ordering=${state.ordering}&page=${state.page}&page_size=15`)
            console.log(res);
            return res.data
        } catch (error) {
            return rejectWithValue()
        }
    }
)

export const fetchGetProductById = createAsyncThunk(
    "products/fetchGetProductById",
    async (id, { rejectWithValue }) => {
        try {
            const res = await getProductById(id)
            return res
        } catch (error) {
            return rejectWithValue()
        }
    }
)

export const fetchSearchProducts = createAsyncThunk(
    "products/fetchSearchProducts",
    async (text, { rejectWithValue, getState }) => {
        try {
            const state = getState().products
            console.log(state);
            const res = await mainInstance.get(`https://reli.one/api/products/search/`, {
                params: {
                    max: state.max,
                    min: state.min,
                    ordering: state.ordering,
                    page: state.searchPage,
                    q: text,
                    page_size: 15
                },
                headers: {
                    Authorization: token ? `Bearer ${token.access}` : ''
                }
            });
            console.log(res);
            return res.data
        } catch (error) {
            return rejectWithValue()
        }
    }
)

const pendingStatus = (state, action) => {
    state.status = "loading"
}
const errStatus = (state, action) => {
    state.status = "error"
}

const productsSlice = createSlice({
    name: "products",
    initialState: {
        products: [],
        product: {},
        err: "",
        status: "",
        category: 2,
        max: 1000000,
        min: 0,
        ordering: "price",
        page: 1,
        searchPage: 1,
        searchResult: {},
        searchStatus: null,
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
        setCategoryForProduct: (state, action) => {
            return {
                ...state, category: action.payload
            }
        },
        setProdPage: (state, action) => {
            return {
                ...state, page: action.payload
            }
        },
        setSearchPage: (state, action) => {
            return {
                ...state, searchPage: action.payload
            }
        }


    },
    extraReducers: builder => {
        builder.addCase(fetchGetProducts.pending, pendingStatus),
            builder.addCase(fetchGetProducts.fulfilled, (state, action) => {
                console.log(action.payload);
                state.products = action.payload.results
                state.status = "fulfilled",
                    state.count = action.payload.count
            }),
            builder.addCase(fetchGetProducts.rejected, errStatus),
            builder.addCase(fetchGetProductById.pending, pendingStatus),
            builder.addCase(fetchGetProductById.fulfilled, (state, action) => {
                state.status = "fulfilled"
                state.product = action.payload.data
            })
        builder.addCase(fetchGetProductById.rejected, errStatus)
        builder.addCase(fetchSearchProducts.fulfilled, (state, action) => {
            state.searchStatus = "fulfilled"
            state.searchResult = action.payload.results
            state.count = action.payload.count
        })
        builder.addCase(fetchSearchProducts.rejected, (state, action) => {
            state.status = "rejected"
            // state.searchResult = action.payload
        })
        builder.addCase(fetchSearchProducts.pending, (state, action) => {
            state.searchStatus = "loading"
        })
    }
})

export const { setOrdering, setMax, setMin, setCategoryForProduct, setProdPage, setSearchPage } = productsSlice.actions

export const { reducer } = productsSlice