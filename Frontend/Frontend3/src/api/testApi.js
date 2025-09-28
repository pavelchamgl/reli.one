import { mainInstance } from "./index";

export const testApi = async () => {
    try {
        const res = await mainInstance.get("/create")
        return res
    } catch (error) {
    }
}