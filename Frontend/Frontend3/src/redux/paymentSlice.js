import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createStripeSession, createPayPalSession } from "../api/payment";

const initialPaymentInfo = JSON.parse(localStorage.getItem("payment")) || {};

const delivery = JSON.parse(localStorage.getItem("delivery")) || []

export const fetchCreateStripeSession = createAsyncThunk(
    "payment/fetchCreateStripeSession",
    async (_, { rejectWithValue, getState }) => {
        try {
            const state = getState().payment;
            const { paymentInfo, selectedProducts } = state;

            console.log(paymentInfo, selectedProducts);

            const res = await createStripeSession({
                email: paymentInfo.email,
                delivery_type: paymentInfo.type,
                delivery_address: `${paymentInfo.address}, ${paymentInfo.country}`,
                phone: paymentInfo.phone,
                delivery_cost: paymentInfo.price,
                courier_service_name: paymentInfo.courier_id,
                products: selectedProducts.map(item => ({
                    product_id: item.product.id,
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
    async (_, { rejectWithValue, getState }) => {
        try {
            const state = getState().payment;
            const { paymentInfo, selectedProducts } = state;

            console.log(paymentInfo, selectedProducts);

            const res = await createPayPalSession({
                email: paymentInfo.email,
                delivery_type: paymentInfo.type,
                delivery_address: `${paymentInfo.address}, ${paymentInfo.country}`,
                phone: paymentInfo.phone,
                delivery_cost: paymentInfo.price,
                courier_service_name: paymentInfo.courier_id,
                products: selectedProducts.map(item => ({
                    product_id: item.product.id,
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
        err: null,
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
                state.status = 'loading';
            })
            .addCase(fetchCreateStripeSession.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(fetchCreateStripeSession.rejected, (state, action) => {
                state.status = 'failed';
                state.err = action.payload;
            })
            .addCase(fetchCreatePayPalSession.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCreatePayPalSession.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(fetchCreatePayPalSession.rejected, (state, action) => {
                state.status = 'failed';
                state.err = action.payload;
            });
    }
});

export const { editValue } = paymentSlice.actions;
export const { reducer } = paymentSlice;
