import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import mainInstance from "../api"
import { date } from "yup";


export const getOrdersByFilters = createAsyncThunk(
    "newOrderSlice/getOrdersByFilters",
    async (_, { getState }) => {
        try {
            const state = getState().newOrder
            console.log(state);

            const res = await mainInstance.get(`sellers/orders/?courier_service=${state.couriers}&date_from=${state.date_from}&date_to=${state.date_to}&delivery_type=${state.delivery_type}&search=${state.search}&status=${state.status}`)
            return res
        } catch (error) {
            console.log(error);

        }
    }
)





const newOrderSlice = createSlice({
    name: "newOrderSlice",
    initialState: {
        search: "",
        couriers: "",
        date_from: "",
        date_to: "",
        status: "",
        delivery_type: "",
        clearFilter: false,
        queryStatus: "",
        data: null,
        selectedIds: [],
    },
    reducers: {
        setSearch: (state, action) => {
            state.search = action.payload.text
        },
        setCouriers: (state, action) => {
            state.couriers = action.payload.value
        },
        setDate: (state, action) => {
            if (action.payload.type === "from") {
                state.date_from = action.payload.text
            } else {
                state.date_to = action.payload.text
            }
        },
        setStatus: (state, action) => {
            state.status = action.payload.value
        },
        setDeliveryType: (state, action) => {
            state.delivery_type = action.payload.value
        },
        setClearFilter: (state, action) => {
            state.search = "",
                state.date_from = "",
                state.date_to = "",
                state.couriers = "",
                state.delivery_type = "",
                state.status = "",
                state.clearFilter = !state.clearFilter
        },

        toggleOrder(state, action) {
            const id = action.payload;
            if (state.selectedIds.includes(id)) {
                state.selectedIds = state.selectedIds.filter(i => i !== id);
            } else {
                state.selectedIds.push(id);
            }
        },

        selectAll(state) {
            state.selectedIds = state.data.map(item => item.id);
        },

        clearAll(state) {
            state.selectedIds = [];
        },
    },
    extraReducers: (build) => {
        build.addCase(getOrdersByFilters.pending, (state, action) => {
            state.queryStatus = "pending"
        }),
            build.addCase(getOrdersByFilters.fulfilled, (state, action) => {
                state.queryStatus = "fulfilled",
                    console.log(action.payload);

                state.data = action.payload.data.results
            }),
            build.addCase(getOrdersByFilters.rejected, (state, action) => {
                state.queryStatus = "rejected",
                    state.data = null

            })
    }
})


export const { setSearch, setCouriers, setDate, setStatus, setDeliveryType, setClearFilter, toggleOrder, clearAll, selectAll } = newOrderSlice.actions

export const { reducer } = newOrderSlice