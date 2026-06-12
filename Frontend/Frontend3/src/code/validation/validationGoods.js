import * as yup from "yup"


export const validateGoods = yup.object().shape({
    name: yup.string().required("Name is required"),
    product_description: yup.string().required("Description is required"),
    item: yup.string()
        .matches(/^\d+$/, { message: "Item must contain only numbers", excludeEmptyString: true })
        .min(10, "Item must be at least 10 digits long"),
    vat_rate: yup.string()
        .matches(/^[0-9]{0,2}([.,][0-9]+)?$/, "The integer part must contain no more than 2 digits"),
    length: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).typeError("Length must be a number").nullable(),
    width: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).typeError("Width must be a number").nullable(),
    height: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).typeError("Height must be a number").nullable(),
    weight: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).typeError("Weight must be a number").nullable(),
});
