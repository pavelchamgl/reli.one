import * as yup from "yup"

const msg = (t, key, fallback) => (t ? t(key) : fallback);

export const getValidateGoods = (t) => yup.object().shape({
    name: yup.string().required(msg(t, "goods.validation.nameRequired", "Name is required")),
    product_description: yup.string().required(msg(t, "goods.validation.descriptionRequired", "Description is required")),
    item: yup.string()
        .matches(/^\d+$/, { message: msg(t, "goods.validation.itemDigitsOnly", "Item must contain only numbers"), excludeEmptyString: true })
        .min(10, msg(t, "goods.validation.itemMinLength", "Item must be at least 10 digits long")),
    vat_rate: yup.string()
        .matches(
            /^[0-9]{0,2}([.,][0-9]+)?$/,
            msg(t, "goods.validation.vatRateDigits", "The integer part must contain no more than 2 digits")
        ),
    warranty_months: yup.string()
        .matches(/^[1-9]\d*$/, { message: msg(t, "goods.validation.warrantyPositiveInteger", "Warranty must be a positive whole number"), excludeEmptyString: true }),
    length: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).typeError(msg(t, "goods.validation.lengthNumber", "Length must be a number")).nullable(),
    width: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).typeError(msg(t, "goods.validation.widthNumber", "Width must be a number")).nullable(),
    height: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).typeError(msg(t, "goods.validation.heightNumber", "Height must be a number")).nullable(),
    weight: yup.number().transform((value, originalValue) => originalValue === "" ? null : value).typeError(msg(t, "goods.validation.weightNumber", "Weight must be a number")).nullable(),
});

export const validateGoods = getValidateGoods();
