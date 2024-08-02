import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createStripeSession, createPayPalSession } from "../api/payment";

const initialPaymentInfo = JSON.parse(localStorage.getItem("payment")) || {};

const selectedValue = JSON.parse(localStorage.getItem("selectedProducts")) || []

const delivery = JSON.parse(localStorage.getItem("delivery")) || []



export const fetchCreateStripeSession = createAsyncThunk(
    "payment/fetchCreateStripeSession",
    async (_, { rejectWithValue, getState }) => {
        try {

            const state = getState().payment.paymentInfo

            console.log(state);

            const res = await createStripeSession({
                email: state.email,
                delivery_type: state.type,
                delivery_address: `${state.address}, ${state.country}`,
                phone: state.phone,
                delivery_cost: state.price,
                courier_service_name: state.courier_id,
                products: selectedValue.map(item => ({
                    product_id: item.product.id,
                    quantity: item.count
                }))
            })

            if (res.status === 200) {
                console.log(res);
                window.location.href = res.data.url
            }

        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const fetchCreatePayPalSession = createAsyncThunk(
    "payment/fetchCreatePayPalSession",
    async (_, { rejectWithValue, getState }) => {
        try {

            const state = getState().payment.paymentInfo

            console.log(state, selectedValue);

            const res = await createPayPalSession({
                email: state.email,
                delivery_type: state.type,
                delivery_address: `${state.address}, ${state.country}`,
                phone: state.phone,
                delivery_cost: state.price,
                courier_service_name: state.courier_id,
                products: selectedValue.map(item => ({
                    product_id: item.product.id,
                    quantity: item.count
                }))
            })

            if (res.status === 200) {
                console.log(res);
                window.location.href = res.data.approval_url
            }

        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

const paymentSlice = createSlice({
    name: "payment",
    initialState: {
        paymentInfo: initialPaymentInfo,
        status: null,
        err: null,
        delivery: delivery
    },
    reducers: {
        editValue: (state, action) => {
            const newPaymentInfo = { ...state.paymentInfo, ...action.payload };
            localStorage.setItem("payment", JSON.stringify(newPaymentInfo));
            state.paymentInfo = newPaymentInfo;
        }
    },
    extraReducers: (builder) => { }
});

export const { editValue } = paymentSlice.actions;
export const { reducer } = paymentSlice
