import { createSlice } from "@reduxjs/toolkit";
import { ErrToast } from "../ui/Toastify";

// Получаем значение корзины из localStorage и парсим его
const basketValue = JSON.parse(localStorage.getItem("basket")) || [];
const basketTotalCount = JSON.parse(localStorage.getItem("basketTotal")) || 0;
const basketSelectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];

const localEmail = localStorage.getItem("email");
const baskets = JSON.parse(localStorage.getItem("baskets")) || [];

const filteredBaskets = baskets.filter((item) => item.email !== localEmail);



const editBaskets = (basket) => {
    if (localEmail) {
        const newBaskets = [
            ...filteredBaskets, {
                email: JSON.parse(localEmail),
                basket: basket
            }
        ]

        localStorage.setItem("baskets", JSON.stringify(newBaskets))
    }
}


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
            if (state.basket?.length < 55) {
                if (state.basket.every((item) => item.sku !== action.payload.sku)) {
                    const newBasket = [...state.basket, action.payload];
                    localStorage.setItem("basket", JSON.stringify(newBasket));
                    editBaskets(newBasket)
                    return {
                        ...state,
                        basket: newBasket
                    };
                }
            } else {
                ErrToast("There should be no more than 55 items in the basket")
            }
        },
        plusCount: (state, action) => {
            const newArr = state.basket.map((item) => {
                if (item.sku === action.payload.sku) {
                    return {
                        ...item,
                        count: action.payload.count
                    };
                }
                return item;
            });
            localStorage.setItem("basket", JSON.stringify(newArr));
            editBaskets(newArr)
            return {
                ...state,
                basket: newArr
            };
        },
        plusCardCount: (state, action) => {

            state.basket = state.basket.map((item) => {
                if (item.sku === action.payload.sku) {
                    item.count = action.payload.count;
                }
                return item;
            });

            // Пересчитываем общее количество товаров только для выбранных продуктов
            let newTotalCount = 0;
            state.basket.forEach((item) => {
                if (item.selected) {
                    newTotalCount += item.count * item.product.price;
                }
            });
            state.totalCount = newTotalCount;

            state.selectedProducts = state.basket.filter((item) => item.selected);

            localStorage.setItem("basket", JSON.stringify(state.basket));
            localStorage.setItem("basketTotal", JSON.stringify(state.totalCount));
            localStorage.setItem("selectedProducts", JSON.stringify(state.selectedProducts));
            editBaskets(state.basket)
        },

        minusCardCount: (state, action) => {
            state.basket = state.basket.map((item) => {
                if (item.sku === action.payload.sku) {
                    item.count = action.payload.count;
                }
                return item;
            });

            // Пересчитываем общее количество товаров только для выбранных продуктов
            let newTotalCount = 0;
            state.basket.forEach((item) => {
                if (item.selected) {
                    newTotalCount += item.count * item.product.price;
                }
            });
            state.totalCount = newTotalCount;

            state.selectedProducts = state.basket.filter((item) => item.selected);

            localStorage.setItem("basket", JSON.stringify(state.basket));
            localStorage.setItem("basketTotal", JSON.stringify(state.totalCount));
            localStorage.setItem("selectedProducts", JSON.stringify(state.selectedProducts));
            editBaskets(state.basket)

        },

        minusCount: (state, action) => {
            const newArr = state.basket.map((item) => {
                if (item.slu === action.payload.sku) {
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
            const itemToDelete = state.basket.find(item => item.sku === action.payload.sku);

            if (itemToDelete && itemToDelete.selected) {
                state.totalCount -= Number(itemToDelete.product.price) * Number(itemToDelete.count);
            }

            // Фильтруем корзину и выбранные продукты
            state.basket = state.basket.filter(item => item.sku !== action.payload.sku);
            state.selectedProducts = state.basket.filter((item) => item.selected);

            localStorage.setItem("basketTotal", JSON.stringify(state.totalCount));
            localStorage.setItem("basket", JSON.stringify(state.basket));
            localStorage.setItem("selectedProducts", JSON.stringify(state.selectedProducts))
        },
        // deleteFromBasket: (state, action) => {
        //     const itemToDelete = state.basket.find(item => item.sku === action.payload.sku);

        //     console.log(action.payload.sku);
        //     console.log(itemToDelete);
        //     console.log(itemToDelete.selected);



        //     if (itemToDelete && itemToDelete.selected) {
        //         state.totalCount = Number(state.totalCount) - Number(itemToDelete.product.price) * Number(itemToDelete.count);
        //     }

        //     const newBasket = state.basket.filter(item => item.sku !== action.payload.sku);
        //     const newSelected = state.basket.filter((item) => item.selected)

        //     localStorage.setItem("basketTotal", JSON.stringify(state.totalCount));
        //     localStorage.setItem("basket", JSON.stringify(newBasket));
        //     localStorage.setItem("selectedProducts", JSON.stringify(newSelected))

        //     editBaskets(state.basket)
        //     return {
        //         ...state,
        //         basket: newBasket,
        //         selectedProducts: newSelected
        //     }

        // },
        selectProduct: (state, action) => {

            console.log(action);
            
            let totalCount = Number(state.totalCount);

            const selectedArr = state.basket.map((item) => {
                const itemPrice = parseFloat(item.product.price) || 0;
                const itemCount = parseInt(item.count) || 0;
                const itemTotal = itemPrice * itemCount;

                if (item.sku === action.payload.sku) {
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
            editBaskets(selectedArr)


            return {
                ...state,
                basket: selectedArr,
                totalCount: totalCount,
                selectedProducts: selectedProducts
            };
        },
        selectAllProducts: (state) => {
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

            editBaskets(selectedArr)

            return {
                ...state,
                basket: selectedArr,
                totalCount: totalCount,
                selectedProducts: selectedProducts
            };
        },
        deselectAllProducts: (state) => {
            const selectedArr = state.basket.map((item) => {
                return {
                    ...item,
                    selected: false
                };
            });

            localStorage.setItem("basket", JSON.stringify(selectedArr));
            localStorage.setItem("basketTotal", JSON.stringify(0));
            localStorage.setItem("selectedProducts", JSON.stringify([]));
            editBaskets(selectedArr)

            return {
                ...state,
                basket: selectedArr,
                totalCount: 0,
                selectedProducts: []
            };
        },
        searchProducts: (state, action) => {
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
        changeVariants: (state, action) => {
            const { id, price, sku } = action.payload;

            const basketProduct = state.basket.find((item) => item.id === id);

            // Проверяем, найден ли продукт в корзине
            if (!basketProduct) {
                return state;
            }

            const newProduct = {
                ...basketProduct,
                product: { ...basketProduct.product, price },
                sku
            };

            const newBasket = state.basket.map((item) =>
                item.id === id ? newProduct : item
            );

            const newSelectedProduct = state.selectedProducts.map((item) =>
                item.id === id ? newProduct : item
            );

            // Записываем в localStorage только если изменились данные
            if (JSON.stringify(newBasket) !== localStorage.getItem("basket")) {
                localStorage.setItem("basket", JSON.stringify(newBasket));
                editBaskets(newBasket)

            }
            if (JSON.stringify(newSelectedProduct) !== localStorage.getItem("selectedProducts")) {
                localStorage.setItem("selectedProducts", JSON.stringify(newSelectedProduct));
            }

            return {
                ...state,
                basket: newBasket,
                selectedProducts: newSelectedProduct
            };
        },
        clearBasket: (state, action) => {
            localStorage.removeItem("basket")
            return {
                ...state, basket: []
            }
        },
        updateBasket: (state, action) => {
            return {
                ...state,
                basket: action.payload
            }
        },
        paymentEndBasket: (state, action) => {
            let newBasket = state.basket.filter((item) => !item.selected)
            localStorage.setItem("basket", JSON.stringify(newBasket))
            localStorage.removeItem("selectedProducts")
            return {
                ...state,
                basket: newBasket
            }
        }

    },

    extraReducers: builder => {
        // Здесь можно добавить дополнительные редюсеры, если это необходимо
    }
});

export const { addToBasket, plusCount, minusCount, deleteFromBasket, selectProduct, selectAllProducts, deselectAllProducts, searchProducts, plusMinusDelivery, basketSelectedProductsPrice, plusCardCount, minusCardCount, updateTotalPrice, changeVariants, clearBasket, updateBasket, paymentEndBasket } = basketSlice.actions;

export const { reducer } = basketSlice;
