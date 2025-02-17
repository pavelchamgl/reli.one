import * as yup from "yup"

export const validateGoods = yup.object().shape({
    name: yup.string("This should be a string").required("Required"),
    product_description: yup.string("This should be a string").required("Required"),
    length: yup.string("This should be a string").required("Required"),
    width: yup.string("This should be a string").required("Required"),
    height: yup.string("This should be a string").required("Required"),
    weight: yup.string("This should be a string").required("Required"),

})