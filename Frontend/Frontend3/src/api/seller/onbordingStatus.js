import mainInstance from "..";

export const getOnbordStatus = async () => {
    try {
        const res = await mainInstance.post('/accounts/password/reset/confirmation/', {

        })
        return res
    } catch (error) {
        console.log(error);
        throw error
    }
}