import mainInstance from "..";

export const postSellerProduct = async (obj) => {
    try {
        const res = await mainInstance.post("/sellers/products/", obj);
        return res.data;
    } catch (error) {
        console.error("Ошибка при отправке данных продавца:", error);

        if (error.response) {
            // Сервер ответил с кодом ошибки (4xx, 5xx)
            throw new Error(error.response.data?.message || "Ошибка на сервере");
        } else if (error.request) {
            // Запрос был сделан, но ответа нет
            throw new Error("Сервер не отвечает. Проверьте соединение.");
        } else {
            // Другая ошибка
            throw new Error("Произошла неизвестная ошибка");
        }
    }
};

export const postSellerImages = async (id, images) => {
    try {
        const newImages = images.map((item) => ({
            image: item?.base64
        }));

        const res = await mainInstance.post(
            `sellers/products/${id}/images/bulk_upload/`,
            { images: newImages }
        );

        return res.data;
    } catch (error) {
        console.error("Ошибка при загрузке изображений:", error);

        if (error.response) {
            throw new Error(error.response.data?.message || "Ошибка на сервере при загрузке изображений");
        } else if (error.request) {
            throw new Error("Сервер не отвечает. Проверьте соединение.");
        } else {
            throw new Error("Произошла неизвестная ошибка");
        }
    }
};



export const postSellerParameters = async (id, obj) => {
    if (!obj || !Array.isArray(obj) || obj.length === 0) {
        throw new Error("Неверные данные: параметры должны быть массивом");
    }

    const queryData = obj.map((item) => ({
        value: item.value,
        name: item.name
    }));

    try {
        const res = await mainInstance.post(
            `/sellers/products/${id}/parameters/bulk_create/`,
            queryData
        );

        return res.data;
    } catch (error) {
        console.error("Ошибка при отправке параметров товара:", error);

        if (error.response) {
            throw new Error(error.response.data?.message || "Ошибка на сервере при отправке параметров");
        } else if (error.request) {
            throw new Error("Сервер не отвечает. Проверьте соединение.");
        } else {
            throw new Error("Произошла неизвестная ошибка");
        }
    }
};

export const postSellerVariants = async (id, obj) => {
    if (!id || !obj?.variants?.length) {
        throw new Error("Некорректные входные данные: отсутствует ID или список вариантов");
    }

    const queryData = obj.variants.map(({ price, image, text }) => ({
        price,
        name: obj.name,
        ...(image ? { image } : { text }),
    }));

    try {
        const res = await mainInstance.post(
            `/sellers/products/${id}/variants/bulk_create/`,
            queryData
        );

        return res.data;
    } catch (error) {
        console.error("Ошибка при отправке данных:", error);

        if (error.response) {
            throw new Error(error.response.data?.message || "Ошибка на сервере при создании вариантов");
        } else if (error.request) {
            throw new Error("Сервер не отвечает. Проверьте соединение.");
        } else {
            throw new Error("Произошла неизвестная ошибка");
        }
    }
};


export const postSellerLisence = async (id, obj) => {
    if (!id || !obj?.name || !obj?.base64) {
        throw new Error("Invalid input: missing ID, file name, or file content");
    }

    try {
        const res = await mainInstance.post(`sellers/products/${id}/license/`, {
            name: obj.name,
            file: obj.base64,
        });

        return res.data;
    } catch (error) {
        console.error("Error uploading license:", error);

        if (error.response) {
            throw new Error(error.response.data?.message || "Server error while uploading license");
        } else if (error.request) {
            throw new Error("No response from the server. Please check the connection.");
        } else {
            throw new Error("An unknown error occurred");
        }
    }
};


