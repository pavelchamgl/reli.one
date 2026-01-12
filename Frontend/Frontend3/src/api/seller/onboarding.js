import mainInstance from "..";




export const postSellerType = async (type) => {
    try {
        const res = await mainInstance.post(
            "/sellers/onboarding/seller-type/",
            { seller_type: type }
        );

        return res.data;
    } catch (error) {
        if (error.response) {
            // Ответ от сервера (401, 403, 400, 500)
            const { status, data } = error.response;

            throw {
                status,
                message: data?.message || "Ошибка сервера",
            };
        }

        if (error.request) {
            // Запрос ушёл, но ответа нет
            throw {
                status: null,
                message: "Сервер недоступен",
            };
        }

        // Любая другая ошибка
        throw {
            status: null,
            message: error.message || "Неизвестная ошибка",
        };
    }
};



export const getOnboardingStatus = async () => {
    try {
        const res = await mainInstance.get("/sellers/onboarding/state/")
        console.log(res);
        // ! выдает 403, как только исправят добью доконца

    } catch (error) {
        console.log(error);

    }
}

export const putOnboardingData = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/bank/", obj)
        console.log(res);

    } catch (error) {

    }
}

export const putPersonalData = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/self-employed/personal/", obj)
        console.log(res);

    } catch (error) {

    }
}