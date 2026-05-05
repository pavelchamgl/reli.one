import mainInstance from ".";
import axios from "axios";
import { BaseURL } from ".";


export const getComments = async (id, page) => {
    try {
        const res = await mainInstance.get(`/reviews/${id}/product/?page=${page}&product_id=${id}&page_size=5`)
        return res
    } catch (error) {
        throw error
    }
}


export const postComment = async (formData) => {
    const token = JSON.parse(localStorage.getItem("token"))?.access;

    try {
        const res = await axios.post(
            `${BaseURL}/reviews/create/`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`, // Токен для авторизации
                },
            }
        );

        return res;
    } catch (error) {
        console.error("Error in postComment:", error);
        throw error;
    }
};

