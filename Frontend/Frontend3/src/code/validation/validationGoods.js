import * as yup from "yup"


export const validateGoods = yup.object().shape({
    name: yup.string().required("Name is required"),
    product_description: yup.string().required("Description is required"),
    item: yup.string()
        .matches(/^\d+$/, "Item must contain only numbers") // Проверяем, что это только цифры
        .min(10, "Item must be at least 10 digits long")    // Проверяем длину (минимум 10 символов)
        .required("Item is required"),
    vat_rate: yup.string()
        .matches(/^[0-9]{0,2}([.,][0-9]+)?$/, "The integer part must contain no more than 2 digits")
        .required("Vat rate is required"),
    length: yup.number().typeError("Length must be a number").required("Length is required"),
    width: yup.number().typeError("Width must be a number").required("Width is required"),
    height: yup.number().typeError("Height must be a number").required("Height is required"),
    weight: yup.number().typeError("Weight must be a number").required("Weight is required"),
});
