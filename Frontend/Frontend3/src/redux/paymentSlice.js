import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createStripeSession, createPayPalSession, calculateDelivery } from "../api/payment";
import { object } from "yup";

const initialPaymentInfo = JSON.parse(localStorage.getItem("payment")) || {};

const delivery = JSON.parse(localStorage.getItem("delivery")) || []

export const fetchCreateStripeSession = createAsyncThunk(
    "payment/fetchCreateStripeSession",
    async (_, { rejectWithValue, getState }) => {
        try {
            const { paymentInfo, groups, country, pointInfo } = getState().payment;
            const { email, name, surename, phone, street, city, zip } = paymentInfo;

            console.log(pointInfo);


            const newGroups = groups.map((item) => {
                if (item.deliveryType === "delivery_point") {
                    return {
                        seller_id: item.seller_id,
                        delivery_type: 1,
                        courier_service: 2,
                        pickup_point_id: item?.pickup_point_id, products: item?.items?.map((product) => {
                            return {
                                sku: product.sku,
                                quantity: product.count
                            }
                        })
                    }
                } else {
                    return {
                        seller_id: item.seller_id,
                        delivery_type: 2,
                        courier_service: 2,
                        delivery_address: {
                            street: street,
                            city: city,
                            zip: zip,
                            country: country?.toUpperCase()
                        },
                        products: item?.items?.map((product) => {
                            return {
                                sku: product.sku,
                                quantity: product.count
                            }
                        })

                    }

                }
            })


            const res = await createStripeSession({
                email: email,
                first_name: name,
                last_name: surename,
                phone: phone,
                groups: newGroups
            });

            console.log(res.data);



            if (res.status === 200) {
                window.location.href = res.data.checkout_url;
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
            const { paymentInfo, groups, country, pointInfo } = getState().payment;
            const { email, name, surename, phone, street, city, zip } = paymentInfo;

            const newGroups = groups.map((item) => {
                if (item.deliveryType === "delivery_point") {
                    return {
                        seller_id: item.seller_id,
                        delivery_type: 1,
                        courier_service: 2,
                        pickup_point_id: item?.pickup_point_id,
                        products: item?.items?.map((product) => {
                            return {
                                sku: product.sku,
                                quantity: product.count
                            }
                        })

                    }
                } else {
                    return {
                        seller_id: item.seller_id,
                        delivery_type: 2,
                        courier_service: 2,
                        delivery_address: {
                            street: street,
                            city: city,
                            zip: zip,
                            country: country?.toUpperCase()
                        },
                        products: item?.items?.map((product) => {
                            return {
                                sku: product.sku,
                                quantity: product.count
                            }
                        })

                    }

                }
            })


            const res = await createPayPalSession({
                email: email,
                first_name: name,
                last_name: surename,
                phone: phone,
                groups: newGroups
            });

            console.log(res);

            if (res.status === 200) {
                window.location.href = res.data.approval_url;
            }
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

export const postCalculateDelivery = createAsyncThunk(
    "payment/postCalculateDelivery",
    async (obj, { rejectWithValue }) => {
        try {
            if (!obj?.seller_id || !obj?.country || !Array.isArray(obj.items)) {
                return rejectWithValue("Invalid input data for delivery calculation");
            }

            const res = await calculateDelivery({
                seller_id: obj.seller_id,
                destination_country: obj.country,
                items: obj.items,
            });

            return {
                ...res,
                seller_id: obj.seller_id,
                queryType: obj?.queryType === "change" ? "change" : null
            };
        } catch (error) {
            const message =
                error?.response?.data?.message || error.message || "Unknown error";
            return rejectWithValue(message);
        }
    }
);


const paymentSlice = createSlice({
    name: "payment",
    initialState: {
        paymentInfo: initialPaymentInfo,
        status: null,
        deliveryStatus: null,
        deliveryCost: null,
        deliveryType: null,
        deliveryCalculateErr: null,
        pointInfo: null,
        loading: false,
        error: null,
        delivery: delivery,
        selectedProducts: JSON.parse(localStorage.getItem("selectedProducts")) || [],
        country: null,
        groups: null
    },
    reducers: {
        editValue: (state, action) => {
            const newPaymentInfo = { ...state.paymentInfo, ...action.payload };
            localStorage.setItem("payment", JSON.stringify(newPaymentInfo));
            state.paymentInfo = newPaymentInfo;
        },
        setCountry: (state, action) => {
            state.country = action.payload.country
        },
        setPointInfo: (state, action) => {
            console.log(state.groups);
            console.log(action.payload);
            state.pointInfo = action.payload

            state.groups = state.groups?.map((item) => {
                if (item.seller_id === action.payload.sellerId) {
                    return {
                        ...item,
                        ...action.payload
                    }
                } else {
                    return item
                }
            })
        },
        setDeliveryType: (state, action) => {
            state.groups = state.groups?.map((item) => {
                if (item.seller_id === action.payload.sellerId) {
                    return {
                        ...item,
                        ...action.payload
                    }
                } else {
                    return item
                }
            })
        },
        setGroups: (state, action) => {
            state.groups = action.payload
        },
        clearDeliveryPrice: (state) => {
            if (Array.isArray(state.groups)) {
                state.groups = state.groups.map(group => ({
                    ...group,
                    deliveryPrice: 0
                }));
            }
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
            })
            .addCase(postCalculateDelivery.pending, (state, action) => {
                state.deliveryStatus = "pending"
            })
            .addCase(postCalculateDelivery.fulfilled, (state, action) => {
                state.deliveryStatus = "fulfilled";

                const payload = action.payload;
                const { seller_id, queryType, options } = payload;

                const targetGroup = state.groups?.find(group => group.seller_id === seller_id);
                const remainingGroups = state.groups?.filter(group => group.seller_id !== seller_id);

                if (queryType === "change" && targetGroup) {
                    const nonPudoOptions = targetGroup.options?.filter(opt => opt.channel !== "PUDO") || [];
                    const newPudoOption = options?.find(opt => opt.channel === "PUDO");


                    console.log(newPudoOption);


                    const updatedGroup = {
                        ...targetGroup,
                        deliveryPrice: newPudoOption?.priceWithVat,
                        options: [...nonPudoOptions, ...(newPudoOption ? [newPudoOption] : [])]
                    };

                    // ❗ Сохраняем порядок
                    state.groups = state.groups?.map(group =>
                        group.seller_id === seller_id ? updatedGroup : group
                    );
                } else {
                    // Обновляем только одну нужную группу, если queryType !== 'change'
                    state.groups = state.groups?.map(group =>
                        group.seller_id === seller_id ? { ...group, ...payload } : group
                    );
                }
            })
            .addCase(postCalculateDelivery.rejected, (state, action) => {
                state.deliveryStatus = "rejected"
                state.deliveryCalculateErr = action.payload
            })
    }
});

export const { editValue, setCountry, setPointInfo, setDeliveryType, setGroups, clearDeliveryPrice } = paymentSlice.actions;
export const { reducer } = paymentSlice;
