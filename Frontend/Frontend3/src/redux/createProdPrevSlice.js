import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { postSellerImages, postSellerLisence, postSellerParameters, postSellerProduct, postSellerVariants } from "../api/seller/sellerProduct"
import { ErrToast } from "../ui/Toastify";

export const fetchCreateProduct = createAsyncThunk(
    "createProdPrev/fetchCreateProduct",
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState().create_prev;

            if (!state) {
                throw new Error("Data for the request not found");
            }

            const { lengthMain, weightMain, widthMain, heightMain } = state;

            // Создаем продукт
            const res = await postSellerProduct({
                name: state.name,
                product_description: state.product_description,
                category: state.category?.id || null,
            });

            if (!res || !res.id) {
                throw new Error("Failed to retrieve the ID of the created product");
            }

            const productId = res.id;

            // Отправляем запросы
            const results = await Promise.allSettled([
                postSellerParameters(productId, [
                    ...(state.product_parameters || []),
                    { name: "length", value: lengthMain ?? "" },
                    { name: "width", value: widthMain ?? "" },
                    { name: "height", value: heightMain ?? "" },
                    { name: "weight", value: weightMain ?? "" },
                ]),
                postSellerVariants(productId, {
                    variants: state.variantsMain || [],
                    name: state.variantsName || "default",
                }),
                postSellerImages(productId, state.images || []),
                state.license_file?.[0]
                    ? postSellerLisence(productId, state.license_file[0])
                    : Promise.resolve(),
            ]);

            console.log(results);


            // Проверяем, были ли ошибки
            const errors = results
                .filter(result => result.status === "rejected")
                .map(result => result.reason);

            if (errors.length > 0) {
                console.error("Errors while creating the product:", errors);
                return rejectWithValue("Error while creating the product. Please check the entered data and try again.");
            }

            return res;
        } catch (error) {
            console.error("Error while creating the product:", error);
            return rejectWithValue(error.response?.data?.message || error.message || "Error while creating the product");
        }
    }
);






const createProdPrevSlice = createSlice({
    name: "createProdPrev",
    initialState: {
        name: "",
        rating: "1.0",
        total_reviews: 0,
        license_file: [],
        name: "",
        product_description: "",
        lengthMain: "",
        widthMain: "",
        heightMain: "",
        weightMain: "",
        images: "",
        category: null,
        variantsMain: [],
        variantsName: "",
        category_name: "",
        // filesMain: null,
        product_parameters: null,
        status: null,
        err: null
    },
    reducers: {
        setName: (state, action) => {
            return {
                ...state, name: action.payload.name
            }
        },
        setLength: (state, action) => {
            return {
                ...state,
                lengthMain: action.payload?.length
            }
        },
        setWidth: (state, action) => {
            return {
                ...state,
                widthMain: action.payload?.width
            }
        },
        setHeigth: (state, action) => {
            return {
                ...state,
                heightMain: action.payload?.height
            }
        },
        setWeight: (state, action) => {
            return {
                ...state,
                weightMain: action.payload?.weight
            }
        },
        setDescription: (state, action) => {
            return {
                ...state, product_description: action.payload
            }
        },
        setCategory: (state, action) => {
            return {
                ...state,
                category: action?.payload,
                category_name: action?.payload?.name
            }
        },
        setParametersPrev: (state, action) => {
            return {
                ...state,
                product_parameters: action.payload
            }
        },
        setImages: (state, action) => {
            return {
                ...state,
                images: action.payload
            }
        },
        setFilesMain: (state, action) => {
            return {
                ...state,
                filesMain: action.payload
            }
        },
        setVariantsPrev: (state, action) => {
            return {
                ...state,
                variantsMain: action.payload,
                price: action?.payload[0]?.price
            }
        },
        deleteImage: (state, action) => {
            return {
                ...state,
                images: state.images.filter((_, i) => i !== action.payload?.index)
            }
        },
        setVariantsName: (state, action) => {
            return {
                ...state,
                variantsName: action.payload.name
            }
        },
        addLicense: (state, action) => {
            return {
                ...state,
                license_file: action.payload
            }
        },
        deleteLicense: (state, action) => {
            return {
                ...state,
                license_file: state.license_file.filter(item => item.id !== action.payload.id)
            }
        }
    },
    extraReducers: build => {
        build.addCase(fetchCreateProduct.pending, (state, action) => {
            state.status = "pending",
                state.err = null
        }),
            build.addCase(fetchCreateProduct.fulfilled, (state, action) => {
                state.status = "fulfilled",
                    state.err = null,
                    console.log(action.payload);

            }),
            build.addCase(fetchCreateProduct.rejected, (state, action) => {
                state.status = "rejected",
                    state.err = action.payload
                ErrToast(action.payload?.message || action.payload || "Ошибка при создании продукта")
            })
    }
})

export const { addLicense, deleteLicense, setName, setDescription, setCategory, setParametersPrev, setImages, setVariantsPrev, setLength, setWidth, setHeigth, setWeight, setFilesMain, deleteImage, setVariantsName } = createProdPrevSlice.actions
export const { reducer } = createProdPrevSlice