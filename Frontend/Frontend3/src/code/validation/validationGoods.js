import * as yup from "yup"


export const validateGoods = yup.object().shape({
    name: yup.string().required("Name is required"),
    product_description: yup.string().required("Description is required"),
    length: yup.number().typeError("Length must be a number").required("Length is required"),
    width: yup.number().typeError("Width must be a number").required("Width is required"),
    height: yup.number().typeError("Height must be a number").required("Height is required"),
    weight: yup.number().typeError("Weight must be a number").required("Weight is required"),
});
