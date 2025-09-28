import mainInstance from "..";



export const getBannerImg = async () => {
    try {
        const res = await mainInstance.get("/banner/banners/")
        console.log(res);
        return res
    } catch (error) {
        console.log(error);

    }
}