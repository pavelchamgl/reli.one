import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getSellerProductById, patchProduct, patchSellerImages } from "../api/seller/editProduct";
import mainInstance from "../api";
import { postSellerImages, postSellerLisence, postSellerParameters, postSellerVariants } from "../api/seller/sellerProduct";
import {
    getSellerCategoryAttributeSchema,
    getSellerProductAttributes,
    putSellerProductAttributes
} from "../api/seller/sellerWizard";
import { ErrToast } from "../ui/Toastify";
import {
    buildAttributePayload,
    CATEGORY_SCHEMA_NOT_READY_MESSAGE,
    isCategoryAttributeSchemaReady,
    mapEditVariantDraftToPatchPayload,
    mapVariantApiToEditDraft,
    normalizeVatRate,
    validateAttributeDraft,
    valuesFromAttributeRows
} from "../utils/sellerProductWizard";

// Получить продукт по ID
export const fetchSellerProductById = createAsyncThunk(
    "editGoodsSeller/fetchSellerProductById",
    async (id, { rejectWithValue }) => {
        try {
            const res = await getSellerProductById(id);
            return res; // Возвращаем только данные
        } catch (error) {
            return rejectWithValue(error?.response?.data || "An error occurred while fetching the product.");
        }
    }
);

export const fetchEditCategoryAttributeSchema = createAsyncThunk(
    "editGoodsSeller/fetchEditCategoryAttributeSchema",
    async (categoryId, { rejectWithValue }) => {
        try {
            if (!categoryId) return null;
            return await getSellerCategoryAttributeSchema(categoryId);
        } catch (error) {
            return rejectWithValue(error?.response?.data || "Unable to load category schema.");
        }
    }
);

export const fetchEditProductAttributes = createAsyncThunk(
    "editGoodsSeller/fetchEditProductAttributes",
    async (productId, { rejectWithValue }) => {
        try {
            if (!productId) return [];
            return await getSellerProductAttributes(productId);
        } catch (error) {
            return rejectWithValue(error?.response?.data || "Unable to load product attributes.");
        }
    }
);

// Удалить параметры
export const fetchDeleteParameters = createAsyncThunk(
    "editGoodsSeller/fetchDeleteParameters",
    async (obj, { dispatch, rejectWithValue }) => {
        try {
            const res = await mainInstance.delete(`sellers/products/${obj?.id}/parameters/${obj?.parId}/`);
            dispatch(deleteParameter(obj?.parId));
            return res;
        } catch (error) {
            return rejectWithValue(error?.response?.data || "An error occurred while deleting parameters.");
        }
    }
);

// Получить изображения
export const fetchGetImages = createAsyncThunk(
    "editGoodsSeller/fetchGetImages",
    async (id, { rejectWithValue, dispatch }) => {
        try {
            const res = await mainInstance.get(`sellers/products/${id}/images/`);
            if (res.status === 200 && res.data) {
                const newObj = res?.data?.map((item) => ({ ...item, status: "server" }));
                dispatch(setImages(newObj));
            }
            return res.data; // Возвращаем данные
        } catch (error) {
            return rejectWithValue(error?.response?.data || "An error occurred while fetching images.");
        }
    }
);

// Удалить изображение
export const fetchDeleteImage = createAsyncThunk(
    "editGoodsSeller/fetchDeleteImage",
    async (obj, { rejectWithValue, dispatch }) => {
        try {
            await mainInstance.delete(`sellers/products/${obj?.prodId}/images/${obj?.imageId}/`);
            dispatch(deleteImage(obj?.imageId));
        } catch (error) {
            ErrToast(error?.response?.data.detail)
            return rejectWithValue(error?.response?.data || "An error occurred while deleting image.");
        }
    }
);

// Удалить вариант
export const fetchDeleteVariant = createAsyncThunk(
    "editGoodsSeller/fetchDeleteVariant",
    async (obj, { rejectWithValue, dispatch }) => {
        try {
            await mainInstance.delete(`sellers/products/${obj?.prodId}/variants/${obj?.varId}/`);
            dispatch(deleteVariant(obj?.varId));
        } catch (error) {
            return rejectWithValue(error?.response?.data || "An error occurred while deleting variant.");
        }
    }
);

export const fetchDeleteLicense = createAsyncThunk(
    "editGoodsSeller/fetchDeleteLicense",
    async (obj, { dispatch, rejectWithValue }) => {
        try {
            await mainInstance.delete(`sellers/products/${obj?.prodId}/license/${obj?.licId}/`);
            dispatch(deleteLicense());
        } catch (error) {
            return rejectWithValue(error?.response?.data || "An error occurred while deleting license.");
        }
    }
)

// Редактирование продукта
export const fetchEditProduct = createAsyncThunk(
    "editGoodsSeller/fetchEditProduct",
    async (id, { rejectWithValue, getState }) => {
        try {
            const state = getState().edit_goods;
            const {
                name, product_description, categoryId, images, parameters, length, lengthId, weight, weightId, width, widthId, height, heightId, variantsName, variantsServ, license_file, item, barcode, additional_details, vat_rate, is_age
            } = state;

            if (categoryId && !isCategoryAttributeSchemaReady({ id: categoryId }, state.attributeSchema, state.attributeSchemaStatus)) {
                return rejectWithValue({
                    message: CATEGORY_SCHEMA_NOT_READY_MESSAGE,
                    attributeErrors: { schema: CATEGORY_SCHEMA_NOT_READY_MESSAGE },
                });
            }

            const attributeErrors = validateAttributeDraft(
                state.attributeSchema?.attributes || [],
                state.attributeValues || {}
            );

            if (Object.keys(attributeErrors).length > 0) {
                return rejectWithValue({
                    message: "Please fill required category attributes.",
                    attributeErrors,
                });
            }

            // Фильтруем локальные и серверные данные
            const newImages = images?.filter((item) => item.status === "local") || [];
            const newParameters = parameters?.filter((item) => item.status === "local") || [];
            const serverParameters = parameters?.filter((item) => item.status === "server") || [];
            const newVariants = variantsServ?.filter((item) => item.status === "local") || [];
            const serverVariants = variantsServ?.filter((item) => item.status === "server") || [];

            // Формируем запросы на обновление параметров и вариантов
            const updateParameterRequests = [
                ...serverParameters,
                { id: lengthId, name: "Length", value: length },
                { id: weightId, name: "Weight", value: weight },
                { id: widthId, name: "Width", value: width },
                { id: heightId, name: "Height", value: height },
            ]
                .filter(param => param.id && param.value !== undefined)
                .map((param) =>
                    mainInstance.patch(`sellers/products/${id}/parameters/${param.id}/`, {
                        name: param.name,
                        value: param.value
                    })
                );

            const updateVariantsRequests = serverVariants
                .filter((param) => param.id !== undefined)
                .map((variant) =>
                    mainInstance.patch(
                        `sellers/products/${id}/variants/${variant.id}/`,
                        mapEditVariantDraftToPatchPayload(variant, variantsName)
                    )
                );

            // Формируем массив запросов
            const requests = [
                patchProduct(id, {
                    name,
                    product_description,
                    category: categoryId,
                    article: item || String(Date.now()),
                    barcode,
                    additional_details,
                    vat_rate: normalizeVatRate(vat_rate),
                    is_age_restricted: Boolean(is_age),
                })
            ];

            if (license_file && license_file?.status === "local") {
                requests.push(
                    postSellerLisence(id, license_file)
                )
            }
            if (newImages.length > 0) requests.push(patchSellerImages(id, newImages));
            if (newParameters.length > 0) requests.push(postSellerParameters(id, newParameters));
            if (updateParameterRequests.length > 0) requests.push(...updateParameterRequests);
            if (newVariants.length > 0) requests.push(postSellerVariants(id, { variants: newVariants, name: state.variantsName }));
            if (updateVariantsRequests.length > 0) requests.push(...updateVariantsRequests);
            if (categoryId) {
                requests.push(putSellerProductAttributes(
                    id,
                    buildAttributePayload(state.attributeSchema?.attributes || [], state.attributeValues || {})
                ));
            }

            // Выполняем все запросы
            await Promise.all(requests);

        } catch (error) {
            return rejectWithValue(error?.response?.data || "An error occurred while editing the product.");
        }
    }
);


const editGoodsSlice = createSlice({
    name: "editGoodsSeller",
    initialState: {
        id: null,
        product: null,
        parameters: null,
        images: [],
        variantsName: "",
        variantsServ: null,
        name: "",
        rating: "1.0",
        total_reviews: 0,
        license_file: null,
        product_description: "",


        length: "",
        lengthId: "",

        width: "",
        widthId: "",

        height: "",
        heightId: "",

        weight: "",
        weightId: "",

        category: null,
        category_name: "",
        price: "",
        categoryId: null,
        // filesMain: null,
        status: null,
        err: null,

        // ! Nurzhan вот тут новое
        item: "",
        barcode: "",
        additional_details: "",
        vat_rate: "",
        is_age: false,
        attributeSchema: null,
        attributeValues: {},
        attributeErrors: {},
        attributeSchemaStatus: "idle",
        attributeValuesStatus: "idle",

    },
    reducers: {
        setParameter: (state, action) => {
            if (action.payload?.name === "name") {
                return {
                    ...state,
                    name: action.payload.value
                }
            }
            if (action.payload?.name === "desc") {
                return {
                    ...state,
                    product_description: action.payload.value
                }
            }
            if (action.payload?.name === "length") {
                return {
                    ...state,
                    length: action.payload.value
                }
            }
            if (action.payload?.name === "width") {
                return {
                    ...state,
                    width: action.payload.value
                }
            }
            if (action.payload?.name === "weight") {
                return {
                    ...state,
                    weight: action.payload.value
                }
            }
            if (action.payload?.name === "height") {
                return {
                    ...state,
                    height: action.payload.value
                }
            }
            if (action.payload?.name === "varName") {
                return {
                    ...state,
                    variantsName: action.payload.value
                }
            }
        },
        setCategory: (state, action) => {
            return {
                ...state,
                category: action?.payload,
                categoryId: action.payload?.id,
                attributeSchema: null,
                attributeValues: {},
                attributeErrors: {},
                attributeSchemaStatus: "idle",
                attributeValuesStatus: "idle"
                // category_name: action?.payload?.name
            }
        },
        deleteParameter: (state, action) => {
            return {
                ...state,
                parameters: state.parameters.filter((item) => {
                    return item.id !== action.payload
                })
            }
        },
        deleteVariant: (state, action) => {
            return {
                ...state,
                variantsServ: state.variantsServ.filter((item) => {
                    return item.id !== action.payload
                })
            }
        },
        setNewParameters: (state, action) => {
            return {
                ...state,
                parameters: action.payload
            }
        },
        setImages: (state, action) => {
            state.images = [...state.images, ...action.payload];
        },

        deleteImage: (state, action) => {

            return {
                ...state,
                images: state.images.filter(item => item.id !== action.payload.id)
            }
        },
        setNewVariants: (state, action) => {
            return {
                ...state,
                variantsServ: action.payload
            }
        },
        setLicense: (state, action) => {
            return {
                ...state,
                license_file: action.payload
            }
        },
        deleteLicense: (state, action) => {
            return {
                ...state,
                license_file: null
            }
        },
        setValues:(state, action)=>{
            return {
                ...state, 
                ...action.payload
            }
        },
        setAttributeValue: (state, action) => {
            const { attributeId, value } = action.payload
            state.attributeValues[attributeId] = value
            delete state.attributeErrors[attributeId]
        },
        setAttributeErrors: (state, action) => {
            state.attributeErrors = action.payload || {}
        }



    },
    extraReducers: build => {
        build.addCase(fetchSellerProductById.fulfilled, (state, action) => {
            state.status = "fulfilled"
            state.err = null
            if (state.id !== action.payload?.id) {
                state.id = action.payload?.id
                state.category_name = action.payload?.category_name
                state.categoryId = action.payload?.category
                state.category = action.payload?.category
                    ? { id: action.payload.category, name: action.payload?.category_name }
                    : null

                state.name = action.payload?.name
                state.product_description = action.payload?.product_description
                state.item = action.payload?.article || ""
                state.barcode = action.payload?.barcode || ""
                state.additional_details = action.payload?.additional_details || ""
                state.vat_rate = action.payload?.vat_rate || ""
                state.is_age = Boolean(action.payload?.is_age_restricted)

                state.product = action.payload,

                    state.images = action.payload?.images

                state.parameters = action.payload?.product_parameters
                    ?.filter(item =>
                        item.name !== "Length" &&
                        item.name !== "Weight" &&
                        item.name !== "Width" &&
                        item.name !== "Height"
                    )
                    .map(item => ({
                        ...item,
                        status: "server"
                    }));

                state.length = action.payload?.product_parameters?.find((item) => item.name === "Length")?.value
                state.weight = action.payload?.product_parameters?.find((item) => item.name === "Weight")?.value
                state.width = action.payload?.product_parameters?.find((item) => item.name === "Width")?.value
                state.height = action.payload?.product_parameters?.find((item) => item.name === "Height")?.value

                state.lengthId = action.payload?.product_parameters?.find((item) => item.name === "Length")?.id
                state.weightId = action.payload?.product_parameters?.find((item) => item.name === "Weight")?.id
                state.widthId = action.payload?.product_parameters?.find((item) => item.name === "Width")?.id
                state.heightId = action.payload?.product_parameters?.find((item) => item.name === "Height")?.id

                state.variantsName = action.payload?.variants ? action.payload.variants[0]?.name : null;
                state.price = action.payload?.variants ? action.payload.variants[0]?.price : null;
                state.variantsServ = action.payload?.variants?.map((item) => {
                    return {
                        ...mapVariantApiToEditDraft(item),
                        status: "server"
                    }
                })

                if (action.payload?.license_file) {
                    state.license_file = {
                        ...action.payload?.license_file,
                        status: "server"
                    }
                }

            }

        })
        build.addCase(fetchSellerProductById.pending, (state) => {
            state.status = "pending";
            state.err = null;
        })
        build.addCase(fetchSellerProductById.rejected, (state, action) => {
            state.status = "rejected";
            state.err = action.payload;
            ErrToast(action.payload || "An error occurred while fetching the product.")
        })

        build.addCase(fetchEditCategoryAttributeSchema.pending, (state) => {
            state.attributeSchemaStatus = "pending";
        })
        build.addCase(fetchEditCategoryAttributeSchema.fulfilled, (state, action) => {
            state.attributeSchemaStatus = "fulfilled";
            state.attributeSchema = action.payload;
            state.attributeErrors = {};
        })
        build.addCase(fetchEditCategoryAttributeSchema.rejected, (state, action) => {
            state.attributeSchemaStatus = "rejected";
            state.attributeSchema = null;
            state.attributeErrors = { schema: action.payload || "Unable to load category schema." };
        })
        build.addCase(fetchEditProductAttributes.pending, (state) => {
            state.attributeValuesStatus = "pending";
        })
        build.addCase(fetchEditProductAttributes.fulfilled, (state, action) => {
            state.attributeValuesStatus = "fulfilled";
            state.attributeValues = valuesFromAttributeRows(action.payload || []);
        })
        build.addCase(fetchEditProductAttributes.rejected, (state, action) => {
            state.attributeValuesStatus = "rejected";
            state.attributeErrors = {
                ...state.attributeErrors,
                values: action.payload || "Unable to load product attributes.",
            };
        })


        build.addCase(fetchDeleteParameters.rejected, (state, action) => {
            state.status = "rejected";
            state.err = action.payload;
            ErrToast(action.payload || "An error occurred while deleting parameters."); // Ошибка
        })
        build.addCase(fetchDeleteImage.rejected, (state, action) => {
            state.status = "rejected";
            state.err = action.payload;
            ErrToast(action.payload?.detail || "An error occurred while deleting image."); // Ошибка
        })
        build.addCase(fetchDeleteVariant.rejected, (state, action) => {
            state.status = "rejected";
            state.err = action.payload;
            ErrToast(action.payload || "An error occurred while deleting variant."); // Ошибка
        })

        build.addCase(fetchEditProduct.pending, (state) => {
            state.status = "pending";
            state.err = null;
        })
        build.addCase(fetchEditProduct.fulfilled, (state) => {
            state.status = "fulfilled";
            state.err = null;
        })
        build.addCase(fetchEditProduct.rejected, (state, action) => {
            state.status = "rejected";
            state.err = action.payload;
            if (action.payload?.attributeErrors) {
                state.attributeErrors = action.payload.attributeErrors;
            }
            ErrToast("An error occurred while editing the product."); // Ошибка
        });
    }
})


export const {
    deleteParameter,
    setNewParameters,
    setImages,
    deleteImage,
    setParameter,
    setCategory,
    setNewVariants,
    deleteVariant,
    setLicense,
    deleteLicense,
    setValues,
    setAttributeValue,
    setAttributeErrors,
} = editGoodsSlice.actions
export const { reducer } = editGoodsSlice
