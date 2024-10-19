import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDetalOrders, getOrders, getOrdersCurrent } from "../api/orders";


export const fetchGetOrders = createAsyncThunk(
    "orders/fetchGetOrders",
    async (_, { rejectWithValue }) => {
        try {
            const res = await getOrders()
            console.log(res);
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const fetchGetOrdersCurrent = createAsyncThunk(
    "orders/fetchGetOrdersCurrent",
    async (_, { rejectWithValue }) => {
        try {
            const res = await getOrdersCurrent()
            console.log(res);
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const fetchGetDetalOrders = createAsyncThunk(
    "orders/fetchGetDetalOrders",
    async (id, { rejectWithValue }) => {
        try {
            const res = await getDetalOrders(id)
            console.log(res);
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }

)

const ordersSlice = createSlice({
    name: "orders",
    initialState: {
        orders: [],
        order: {},
        orderStatus: null,
        ordersStatus: null,
        err: null,
    },
    reducers: {},
    extraReducers: builder => {
        builder.addCase(fetchGetOrders.fulfilled, (state, action) => {
            state.ordersStatus = "fulfilled"
            state.orders = action.payload
        }), builder.addCase(fetchGetOrders.pending, (state, action) => {
            state.orderStatus = "loading"
        }), builder.addCase(fetchGetOrders.rejected, (state, action) => {
            state.status = "rejected"
        }),
            builder.addCase(fetchGetOrdersCurrent.fulfilled, (state, action) => {
                state.ordersStatus = "fulfilled"
                state.orders = action.payload
            }), builder.addCase(fetchGetOrdersCurrent.pending, (state, action) => {
                state.orderStatus = "loading"
            }), builder.addCase(fetchGetOrdersCurrent.rejected, (state, action) => {
                state.status = "rejected"
            }),
            builder.addCase(fetchGetDetalOrders.fulfilled, (state, action) => {
                state.orderStatus = "fulfilled"
                state.order = action.payload
            }), builder.addCase(fetchGetDetalOrders.pending, (state, action) => {
                state.orderStatus = "loading"
            }), builder.addCase(fetchGetDetalOrders.rejected, (state, action) => {
                state.orderStatus = "rejected"
            })
    }
})

export const { } = ordersSlice.actions
export const { reducer } = ordersSlice