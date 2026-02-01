import mainInstance from ".."

export const registerSeller = async (data) => {
    try {
        const res = await mainInstance.post("/accounts/register/seller/", data)
        return res
    } catch (error) {
        throw error
    }
}