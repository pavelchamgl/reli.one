import { createSlice } from "@reduxjs/toolkit";

// Получаем значение корзины из localStorage и парсим его
const basketValue = JSON.parse(localStorage.getItem("basket")) || [];
const basketTotalCount = JSON.parse(localStorage.getItem("basketTotal")) || 0;
const basketSelectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];

const basketSlice = createSlice({
    name: "basket",
    initialState: {
        basket: basketValue,
        err: "",
        status: "",
        totalCount: basketTotalCount,
        selectedProducts: basketSelectedProducts
    },
    reducers: {
        addToBasket: (state, action) => {
            if (state.basket.every((item) => item.id !== action.payload.id)) {
                const newBasket = [...state.basket, action.payload];
                localStorage.setItem("basket", JSON.stringify(newBasket));
                return {
                    ...state,
                    basket: newBasket
                };
            }
        },
        plusCount: (state, action) => {
            console.log("uihhubhb");
            const newArr = state.basket.map((item) => {
                if (item.id === action.payload.id) {
                    return {
                        ...item,
                        count: action.payload.count
                    };
                }
                return item;
            });
            localStorage.setItem("basket", JSON.stringify(newArr));
            return {
                ...state,
                basket: newArr
            };
        },
        plusCardCount: (state, action) => {
            state.basket = state.basket.map((item) => {
                if (item.id === action.payload.id) {
                    item.count = action.payload.count;
                }
                return item;
            });

            // Пересчитываем общее количество товаров
            let newTotalCount = 0;
            state.basket.forEach((item) => {
                console.log(item);
                newTotalCount += item.count * item.product.price;
            });
            state.totalCount = newTotalCount;

            state.selectedProducts = state.basket.filter((item) => item.selected)


            localStorage.setItem("basket", JSON.stringify(state.basket));
            localStorage.setItem("basketTotal", JSON.stringify(state.totalCount));
            localStorage.setItem("selectedProducts", JSON.stringify(state.selectedProducts))

        },
        minusCardCount: (state, action) => {
            state.basket = state.basket.map((item) => {
                if (item.id === action.payload.id) {
                    item.count = action.payload.count;
                }
                return item;
            });

            // Пересчитываем общее количество товаров
            let newTotalCount = 0;
            state.basket.forEach((item) => {
                console.log(item);
                newTotalCount += item.count * item.product.price;
            });
            state.totalCount = newTotalCount;

            state.selectedProducts = state.basket.filter((item) => item.selected)

            localStorage.setItem("basket", JSON.stringify(state.basket));
            localStorage.setItem("basketTotal", JSON.stringify(state.totalCount));
            localStorage.setItem("selectedProducts", JSON.stringify(state.selectedProducts))
        },
        minusCount: (state, action) => {
            console.log(2);
            const newArr = state.basket.map((item) => {
                if (item.id === action.payload.id) {
                    return {
                        ...item,
                        count: action.payload.count
                    };
                }
                return item;
            });
            localStorage.setItem("basket", JSON.stringify(newArr));
            return {
                ...state,
                basket: newArr
            };
        },
        deleteFromBasket: (state, action) => {
            console.log(3);
            const itemToDelete = state.basket.find(item => item.id === action.payload.id);

            if (itemToDelete && itemToDelete.selected) {
                state.totalCount = Number(state.totalCount) - Number(itemToDelete.product.price) * Number(itemToDelete.count);
            }

            state.basket = state.basket.filter(item => item.id !== action.payload.id);
            state.selectedProducts = state.basket.filter((item) => item.selected)


            localStorage.setItem("basketTotal", JSON.stringify(state.totalCount));
            localStorage.setItem("basket", JSON.stringify(state.basket));
            localStorage.setItem("selectedProducts", JSON.stringify(state.selectedProducts))
        },
        selectProduct: (state, action) => {
            let totalCount = Number(state.totalCount);

            const selectedArr = state.basket.map((item) => {
                const itemPrice = parseFloat(item.product.price) || 0;
                const itemCount = parseInt(item.count) || 0;
                const itemTotal = itemPrice * itemCount;

                if (item.id === action.payload.id) {
                    if (action.payload.selected) {
                        totalCount += itemTotal;
                    }
                    else {
                        if (totalCount) {
                            totalCount -= itemTotal;
                        }
                    }
                    return {
                        ...item,
                        selected: action.payload.selected
                    };
                }

                return item;
            });

            const selectedProducts = selectedArr.filter(item => item.selected);
            localStorage.setItem("basket", JSON.stringify(selectedArr));
            localStorage.setItem("basketTotal", JSON.stringify(totalCount));
            localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));

            return {
                ...state,
                basket: selectedArr,
                totalCount: totalCount,
                selectedProducts: selectedProducts
            };
        },
        selectAllProducts: (state) => {
            console.log(5);
            let totalCount = 0;

            const selectedArr = state.basket.map((item) => {
                const itemPrice = parseFloat(item.product.price) || 0;
                const itemCount = parseInt(item.count) || 0;
                const itemTotal = itemPrice * itemCount;

                totalCount += itemTotal;

                return {
                    ...item,
                    selected: true
                };
            });

            const selectedProducts = selectedArr.filter(item => item.selected);

            localStorage.setItem("basket", JSON.stringify(selectedArr));
            localStorage.setItem("basketTotal", JSON.stringify(totalCount));
            localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));

            return {
                ...state,
                basket: selectedArr,
                totalCount: totalCount,
                selectedProducts: selectedProducts
            };
        },
        deselectAllProducts: (state) => {
            console.log(6);
            const selectedArr = state.basket.map((item) => {
                return {
                    ...item,
                    selected: false
                };
            });

            localStorage.setItem("basket", JSON.stringify(selectedArr));
            localStorage.setItem("basketTotal", JSON.stringify(0));
            localStorage.setItem("selectedProducts", JSON.stringify([]));

            return {
                ...state,
                basket: selectedArr,
                totalCount: 0,
                selectedProducts: []
            };
        },
        searchProducts: (state, action) => {
            console.log(7);
            const searchTerm = action.payload.text.toLowerCase();

            // Если поисковый запрос пустой, возвращаем оригинальную корзину
            if (!searchTerm) {
                return {
                    ...state,
                    filteredBasket: null,  // Восстанавливаем изначальную корзину
                    searchTerm: ''
                };
            }

            // Фильтруем корзину на основе поискового запроса
            const filteredBasket = state.basket.filter((item) =>
                item.product.name.toLowerCase().includes(searchTerm)
            );

            return {
                ...state,
                filteredBasket: filteredBasket,
                searchTerm: searchTerm
            };
        },
        plusMinusDelivery: (state, action) => {
            let newTotal;

            if (action.payload.type === "plus") {
                newTotal = state.totalCount + action.payload.price
                console.log(state.totalCount);
                console.log(action.payload.price);
                console.log(newTotal);
            } else {
                newTotal = state.totalCount - action.payload.price
            }
            localStorage.setItem("basketTotal", JSON.stringify(newTotal))
            return {
                ...state,
                totalCount: newTotal
            }
        },
        basketSelectedProductsPrice: (state, action) => {
            // Вычисление общей стоимости продуктов с использованием reduce
            const totalPrice = state.selectedProducts.reduce((sum, element) => {
                return sum + (Number(element.product.price) * element.count)
            }, 0);

            // Сохранение общей стоимости в localStorage
            localStorage.setItem("basketTotal", JSON.stringify(totalPrice));

            // Возвращение обновленного состояния
            return {
                ...state,
                totalCount: totalPrice  // Предполагая, что вам нужно обновить `totalPrice`, а не `totalCount`
            };
        },
        updateTotalPrice: (state) => {
            const totalPrice = state.basket.reduce((sum, item) => {
                if (item.selected) {
                    return sum + (Number(item.product.price) * item.count);
                }
                return sum;
            }, 0);

            localStorage.setItem("basketTotal", JSON.stringify(totalPrice));

            return {
                ...state,
                totalCount: totalPrice
            };
        },
    },

    extraReducers: builder => {
        // Здесь можно добавить дополнительные редюсеры, если это необходимо
    }
});

export const { addToBasket, plusCount, minusCount, deleteFromBasket, selectProduct, selectAllProducts, deselectAllProducts, searchProducts, plusMinusDelivery, basketSelectedProductsPrice, plusCardCount, minusCardCount, updateTotalPrice } = basketSlice.actions;

export const { reducer } = basketSlice;
