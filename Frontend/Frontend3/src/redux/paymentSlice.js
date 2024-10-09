import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createStripeSession, createPayPalSession } from "../api/payment";

const initialPaymentInfo = JSON.parse(localStorage.getItem("payment")) || {};

const delivery = JSON.parse(localStorage.getItem("delivery")) || []

export const fetchCreateStripeSession = createAsyncThunk(
    "payment/fetchCreateStripeSession",
    async (selectedProducts, { rejectWithValue, getState }) => {
        try {
            const state = getState().payment;
            const { paymentInfo } = state;


            const res = await createStripeSession({
                email: paymentInfo.email,
                delivery_type: paymentInfo.type,
                delivery_address: `${paymentInfo.address}, ${paymentInfo.country}`,
                phone: paymentInfo.phone,
                delivery_cost: paymentInfo.price,
                courier_service: paymentInfo.courier_id,
                products: selectedProducts.map(item => ({
                    sku: item.sku,
                    quantity: item.count
                }))
            });

            if (res.status === 200) {
                console.log(res);
                window.location.href = res.data.url;
            }
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);


export const fetchCreatePayPalSession = createAsyncThunk(
    "payment/fetchCreatePayPalSession",
    async (selectedProducts, { rejectWithValue, getState }) => {
        try {
            const state = getState().payment;
            const { paymentInfo } = state;


            const res = await createPayPalSession({
                email: paymentInfo.email,
                delivery_type: paymentInfo.type,
                delivery_address: `${paymentInfo.address}, ${paymentInfo.country}`,
                phone: paymentInfo.phone,
                delivery_cost: paymentInfo.price,
                courier_service: paymentInfo.courier_id,
                products: selectedProducts.map(item => ({
                    sku: item.sku,
                    quantity: item.count
                }))
            });

            if (res.status === 200) {
                console.log(res);
                window.location.href = res.data.approval_url;
            }
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

const paymentSlice = createSlice({
    name: "payment",
    initialState: {
        paymentInfo: initialPaymentInfo,
        status: null,
        loading: false,
        error: null,
        delivery: delivery,
        selectedProducts: JSON.parse(localStorage.getItem("selectedProducts")) || []
    },
    reducers: {
        editValue: (state, action) => {
            const newPaymentInfo = { ...state.paymentInfo, ...action.payload };
            localStorage.setItem("payment", JSON.stringify(newPaymentInfo));
            state.paymentInfo = newPaymentInfo;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCreateStripeSession.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCreateStripeSession.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchCreateStripeSession.rejected, (state, action) => {
                state.loading = false;
                state.error = "Error executing request";
            })
            .addCase(fetchCreatePayPalSession.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCreatePayPalSession.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchCreatePayPalSession.rejected, (state, action) => {
                state.loading = false;
                state.error = "Error executing request";
            });
    }
});

export const { editValue } = paymentSlice.actions;
export const { reducer } = paymentSlice;
