import mainInstance from "..";

export const postSellerProduct = async (obj) => {
    try {
        const res = await mainInstance.post("/sellers/products/", obj)
        console.log(res);
        return res
    } catch (error) {
        console.log(error)
    }
}

export const postSellerImages = async (id, files) => {
    try {
        const formData = new FormData();

        Array.from(files).forEach((file) => {
            formData.append("image", file); // Если сервер ждет массив, можно `image[]`
        });

        const res = await mainInstance.post(
            `/sellers/products/${id}/images/`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" } // Переопределяем заголовок
            }
        );

        console.log(res);
        return res;
    } catch (error) {
        console.log(error);
    }
};


export const postSellerParameters = async (id, obj) => {

    let queryData;

    if (obj) {
        queryData = obj.map((item) => {
            return {
                value: item.value,
                name: item.name
            }
        })
    }

    try {
        const res = await mainInstance.post(`/sellers/products/${id}/parameters/bulk_create/`, queryData)
        console.log(res);
        return res
    } catch (error) {
        console.log(error)
    }
}

export const postSellerVariants = async (id, obj) => {
    if (!id || !obj?.variants?.length) {
        console.error('Некорректные входные данные:', { id, obj });
        return null;
    }

    const queryData = obj.variants.map(({ price, image, text }) => ({
        price,
        name: obj.name,
        ...(image ? { image } : { text }),
    }));

    try {
        const res = await mainInstance.post(`/sellers/products/${id}/variants/bulk_create/`, queryData);

        if (res?.data) {
            console.log('Ответ сервера:', res.data);
            return res.data;
        } else {
            console.warn('Пустой ответ от сервера');
            return null;
        }
    } catch (error) {
        console.error('Ошибка при отправке данных:', error?.response?.data || error.message);
        return null;
    }
};

