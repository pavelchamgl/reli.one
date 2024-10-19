import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getFavoriteProducts } from "../api/favorite";

export const fetchFavoriteProducts = createAsyncThunk(
    "favorites/fetchFavoriteProducts",
    async (_, { rejectWithValue, getState }) => {
        try {
            const state = getState().favorites;
            const res = await getFavoriteProducts(state.page, state.ordering);
            console.log(res);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response ? error.response.data : error.message);
        }
    }
);

const favoriteSlice = createSlice({
    name: "favorites",
    initialState: {
        products: [],
        status: null,
        error: null,
        page: 1,
        ordering: "popular",
        count: null,
    },
    reducers: {
        setOrderingFav: (state, action) => {
            state.ordering = action.payload;
        },
        setPageFav: (state, action) => {
            state.page = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFavoriteProducts.fulfilled, (state, action) => {
                state.products = action.payload.results;
                state.count = action.payload.count
                state.status = "fulfilled";
            })
            .addCase(fetchFavoriteProducts.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchFavoriteProducts.rejected, (state, action) => {
                state.status = "rejected";
                state.error = action.payload;
            });
    },
});

export const { setOrderingFav, setPageFav } = favoriteSlice.actions;
export const { reducer } = favoriteSlice;
