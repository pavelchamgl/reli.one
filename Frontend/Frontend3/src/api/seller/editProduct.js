import mainInstance from "..";

// Получение информации о продукте по ID
export const getSellerProductById = async (id) => {
    try {
        const res = await mainInstance.get(`sellers/products/${id}/`);
        return res.data; // Возвращаем только `data`, а не весь объект ответа
    } catch (error) {
        console.error("Error while fetching product:", error?.response?.data || error.message);
        return { error: "An error occurred while fetching the product." };
    }
};

// Частичное обновление продукта (PATCH)
export const patchProduct = async (prodId, obj) => {
    try {
        const res = await mainInstance.patch(`sellers/products/${prodId}/`, obj);
        return res.data; // Возвращаем `data`
    } catch (error) {
        console.error("Error while updating product:", error?.response?.data || error.message);
        throw new Error("An error occurred while updating the product."); // Возвращаем ошибку на английском
    }
};

// Обновление изображений товара
export const patchSellerImages = async (id, images) => {
    try {
        if (!images?.length) {
            console.warn("Empty images array provided, request not executed.");
            return { error: "No images provided." };
        }

        const newImages = images.map((item) => ({ image: item?.image }));

        const res = await mainInstance.post(`sellers/products/${id}/images/bulk_upload/`, {
            images: newImages,
        });

        return res.data; // Возвращаем `data`
    } catch (error) {
        console.error("Error while uploading images:", error?.response?.data || error.message);
        return { error: "An error occurred while uploading images." }; // Ошибка на английском
    }
};

