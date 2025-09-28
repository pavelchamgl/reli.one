import { createSlice } from "@reduxjs/toolkit";
import { ErrToast } from "../ui/Toastify";
import { trackAddToCart } from "../analytics/analytics";

const initialState = {
    basket: [],       // Корзина текущего пользователя
    baskets: [],      // Корзины всех пользователей
    err: "",
    status: "",
    totalCount: 0,
    selectedProducts: [],
    filteredBasket: null,
    searchTerm: ""
};

const basketSlice = createSlice({
    name: "basket",
    initialState,
    reducers: {
        // Добавление товара в корзину
        addToBasket: (state, action) => {
            if (state.basket.length < 55) {
                if (state.basket.every((item) => item.sku !== action.payload.sku)) {
                    state.basket.push(action.payload);
                }
                trackAddToCart(action.payload?.product)
            } else {
                ErrToast("There should be no more than 55 items in the basket");
            }

            // Синхронизация корзины с baskets
            const email = JSON.parse(localStorage.getItem("email"));
            if (email) {
                const existingIndex = state.baskets.findIndex(item => item.email === email);
                if (existingIndex !== -1) {
                    state.baskets[existingIndex].basket = [...state.basket];
                }
            }
        },

        // Обновление количества товара в корзине
        plusCount: (state, action) => {
            state.basket = state.basket.map((item) =>
                item.sku === action.payload.sku
                    ? { ...item, count: action.payload.count }
                    : item
            );

            // Синхронизация корзины с baskets
            const email = JSON.parse(localStorage.getItem("email"));
            if (email) {
                const existingIndex = state.baskets.findIndex(item => item.email === email);
                if (existingIndex !== -1) {
                    state.baskets[existingIndex].basket = [...state.basket];
                }
            }

            // Пересчитываем общую сумму
            state.totalCount = state.basket.reduce((sum, item) =>
                item.selected ? sum + item.count * item.product.price : sum, 0
            );
        },

        // Уменьшение количества товара в корзине
        minusCount: (state, action) => {
            state.basket = state.basket.map((item) =>
                item.sku === action.payload.sku
                    ? { ...item, count: action.payload.count }
                    : item
            );

            // Синхронизация корзины с baskets
            const email = JSON.parse(localStorage.getItem("email"));
            if (email) {
                const existingIndex = state.baskets.findIndex(item => item.email === email);
                if (existingIndex !== -1) {
                    state.baskets[existingIndex].basket = [...state.basket];
                }
            }

            // Пересчитываем общую сумму
            state.totalCount = state.basket.reduce((sum, item) =>
                item.selected ? sum + item.count * item.product.price : sum, 0
            );
        },

        // Увеличение количества товара (по кнопке)
        plusCardCount: (state, action) => {
            state.basket = state.basket.map((item) => {
                if (item.sku === action.payload.sku) {
                    item.count = action.payload.count;
                }
                return item;
            });

            state.totalCount = state.basket.reduce((sum, item) =>
                item.selected ? sum + item.count * item.product.price : sum, 0);

            state.selectedProducts = state.basket.filter((item) => item.selected);

            // Синхронизация корзины с baskets
            const email = JSON.parse(localStorage.getItem("email"));
            if (email) {
                const existingIndex = state.baskets.findIndex(item => item.email === email);
                if (existingIndex !== -1) {
                    state.baskets[existingIndex].basket = [...state.basket];
                }
            }
        },

        // Уменьшение количества товара (по кнопке)
        minusCardCount: (state, action) => {
            state.basket = state.basket.map((item) => {
                if (item.sku === action.payload.sku) {
                    item.count = action.payload.count;
                }
                return item;
            });

            state.totalCount = state.basket.reduce((sum, item) =>
                item.selected ? sum + item.count * item.product.price : sum, 0);

            state.selectedProducts = state.basket.filter((item) => item.selected);

            // Синхронизация корзины с baskets
            const email = JSON.parse(localStorage.getItem("email"));
            if (email) {
                const existingIndex = state.baskets.findIndex(item => item.email === email);
                if (existingIndex !== -1) {
                    state.baskets[existingIndex].basket = [...state.basket];
                }
            }
        },

        // Удаление товара из корзины
        deleteFromBasket: (state, action) => {
            const itemToDelete = state.basket.find(item => item.sku === action.payload.sku);

            if (itemToDelete?.selected) {
                state.totalCount -= Number(itemToDelete.product.price) * Number(itemToDelete.count);
            }

            state.basket = state.basket.filter(item => item.sku !== action.payload.sku);
            state.selectedProducts = state.basket.filter(item => item.selected);

            // Синхронизация корзины с baskets
            const email = JSON.parse(localStorage.getItem("email"));
            if (email) {
                const existingIndex = state.baskets.findIndex(item => item.email === email);
                if (existingIndex !== -1) {
                    state.baskets[existingIndex].basket = [...state.basket];
                }
            }
        },

        // Синхронизация корзины с baskets (при логине)
        syncBasket: (state) => {
            const email = JSON.parse(localStorage.getItem("email"));  // Получаем email из localStorage
            if (!email) return;

            const currentBasket = [...state.basket];

            // ✅ Если baskets не инициализирован, инициализируем как пустой массив
            if (!Array.isArray(state.baskets)) {
                state.baskets = [];
            }

            // ✅ Безопасно ищем индекс корзины пользователя
            const existingIndex = state.baskets.findIndex(item => item?.email === email);

            if (existingIndex === -1) {
                // Если корзины еще нет — создаём новую
                state.baskets.push({ email, basket: currentBasket });
            } else {
                // Если корзина есть — мержим
                const existingBasket = state.baskets[existingIndex].basket;
                const mergedBasket = [...existingBasket];

                currentBasket.forEach(newItem => {
                    const existingItemIndex = mergedBasket.findIndex(item => item.sku === newItem.sku);
                    if (existingItemIndex === -1) {
                        mergedBasket.push(newItem);
                    }
                });

                state.baskets[existingIndex].basket = mergedBasket;
            }

            // Обновляем текущую корзину и сумму
            state.basket = state.baskets.find(item => item?.email === email)?.basket || [];
            state.totalCount = state.basket.reduce((sum, item) => sum + item.count * item.product.price, 0);
        },


        // Очистка корзины
        clearBasket: (state) => {
            state.basket = [];
            state.totalCount = 0;
            state.selectedProducts = [];
            state.filteredBasket = null;
        },

        // Выбор всех товаров
        selectAllProducts: (state) => {
            state.totalCount = state.basket.reduce(
                (sum, item) => sum + item.product.price * item.count, 0
            );

            state.basket = state.basket.map((item) => ({ ...item, selected: true }));
            state.selectedProducts = [...state.basket];

            // Синхронизация корзины с baskets
            const email = JSON.parse(localStorage.getItem("email"));
            if (email) {
                const existingIndex = state.baskets.findIndex(item => item.email === email);
                if (existingIndex !== -1) {
                    state.baskets[existingIndex].basket = [...state.basket];
                }
            }
        },

        // Снятие выбора всех товаров
        deselectAllProducts: (state) => {
            state.basket = state.basket.map((item) => ({ ...item, selected: false }));
            state.totalCount = 0;
            state.selectedProducts = [];

            // Синхронизация корзины с baskets
            const email = JSON.parse(localStorage.getItem("email"));
            if (email) {
                const existingIndex = state.baskets.findIndex(item => item.email === email);
                if (existingIndex !== -1) {
                    state.baskets[existingIndex].basket = [...state.basket];
                }
            }
        },

        selectProduct: (state, action) => {
            let totalCount = state.totalCount;

            // Обновляем корзину с новым состоянием выбранных товаров
            state.basket = state.basket.map((item) => {
                const itemTotal = item.product.price * item.count;

                if (item.sku === action.payload.sku) {
                    if (action.payload.selected) {
                        // Добавляем товар в общий итог, если он выбран
                        totalCount += itemTotal;
                    } else {
                        // Убираем товар из общего итога, если он снят с выбора
                        totalCount -= itemTotal;
                    }
                    return { ...item, selected: action.payload.selected };
                }
                return item;
            });

            // Обновляем общий итог
            state.totalCount = totalCount;

            // Обновляем список выбранных товаров
            state.selectedProducts = state.basket.filter(item => item.selected);

            // Если корзина синхронизирована с сервером, обновляем соответствующее состояние
            const email = JSON.parse(localStorage.getItem("email"));
            if (email) {
                const existingIndex = state.baskets.findIndex(item => item.email === email);
                if (existingIndex !== -1) {
                    // Обновляем корзину в глобальном состоянии, если этот пользователь уже есть
                    state.baskets[existingIndex].basket = state.basket;
                }
            }
        },


        // Поиск товаров
        searchProducts: (state, action) => {
            const searchTerm = action.payload.text.toLowerCase();

            state.searchTerm = searchTerm;
            state.filteredBasket = searchTerm
                ? state.basket.filter(item =>
                    item.product.name.toLowerCase().includes(searchTerm))
                : null;
        },

        // Изменение стоимости доставки
        plusMinusDelivery: (state, action) => {
            const price = action.payload.price;
            state.totalCount += action.payload.type === "plus" ? price : -price;
        },

        // Пересчет общей стоимости выбранных товаров
        basketSelectedProductsPrice: (state) => {
            state.totalCount = state.selectedProducts.reduce(
                (sum, item) => sum + item.count * item.product.price, 0
            );
        },

        // Обновление общей стоимости корзины
        updateTotalPrice: (state) => {
            state.totalCount = state.basket.reduce(
                (sum, item) => item.selected ? sum + item.count * item.product.price : sum, 0
            );
        },

        // Обновление вариантов товара (например, цены или SKU)
        changeVariants: (state, action) => {
            const { id, price, sku } = action.payload;

            state.basket = state.basket.map((item) =>
                item.id === id
                    ? { ...item, product: { ...item.product, price }, sku }
                    : item
            );

            state.selectedProducts = state.selectedProducts.map((item) =>
                item.id === id
                    ? { ...item, product: { ...item.product, price }, sku }
                    : item
            );
        },

        // Обновление корзины
        updateBasket: (state, action) => {
            state.basket = action.payload;
        },

        // Обновление всех корзин
        updateBaskets: (state, action) => {
            state.baskets = action.payload;
        },

        // Завершение покупки
        paymentEndBasket: (state) => {
            state.basket = state.basket.filter(item => !item.selected);
            state.selectedProducts = [];
            state.totalCount = 0;
        },

        deleteBaskets: (state, action) => {
            const email = JSON.parse(localStorage.getItem("email"));
            if (!email) return;

            state.baskets = state.baskets.filter(item => item?.email !== email);
            state.basket = []; // очищаем текущую корзину
            state.totalCount = 0;
            state.selectedProducts = [];
        },

        updateProductPrice: (state, action) => {


            state.basket = state.basket.map((item) => {
                if (action.payload.sku === item?.sku) {

                    return {
                        ...item,
                        product: {
                            ...action.payload.data,
                            price: action.payload.price
                        }
                    }
                } else {
                    return item
                }
            })


            const email = JSON.parse(localStorage.getItem("email"));
            if (email) {
                const existingIndex = state.baskets.findIndex(item => item.email === email);
                if (existingIndex !== -1) {
                    state.baskets[existingIndex].basket = [...state.basket];
                }
            }
        }
    }
});

export const {
    addToBasket,
    plusCount,
    minusCount,
    deleteFromBasket,
    selectProduct,
    selectAllProducts,
    deselectAllProducts,
    searchProducts,
    plusMinusDelivery,
    basketSelectedProductsPrice,
    plusCardCount,
    minusCardCount,
    updateTotalPrice,
    changeVariants,
    clearBasket,
    updateBasket,
    updateBaskets,
    paymentEndBasket,
    syncBasket,
    deleteBaskets,
    updateProductPrice
} = basketSlice.actions;

export const { reducer } = basketSlice;
