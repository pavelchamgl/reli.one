import { getApi, mainInstance } from "./index";
import axios from "axios";

// export const getProducts = async () => {
//     try {
//         const res = await getApi("/BaseProductListView?")
//         return res
//     } catch (error) {
//         throw error
//     }
// }

// export const getProducts = async (name, category) => {
//     try {
//         const res = await mainInstance.get("/BaseProductListView?", {
//             params: {
//                 name__icontains: name,
//                 category__name: category
//             }
//         })
//         return res
//     } catch (error) {
//         throw error
//     }
// }

export const getProducts = async (params) => {
    try {
        const response = await mainInstance.get('/products/', {
            params: {
                categories: params.category,
                max_price: params.max,
                min_price: params.min,
                ordering: params.ordering,
                page: params.page,
            }
        });

        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getProductById = async (id) => {
    try {
        const res = await getApi(`products/${id}/?id=${id}`)
        return res
    } catch (error) {
        throw error
    }
}

export const getSearchProducts = async () => {
    try {
        const res = await mainInstance.get("")
    } catch (error) {
        throw error
    }
}
