import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import EditGoodsParameters from "../editGoodsParameters/EditGoodsParameters";
import CreateFormInp from "../../../../ui/Seller/create/createFormInp/CreateFormInp";
import CreateCategoryMain from "../../../../ui/Seller/create/createCategory/createCategoryMain/CreateCategoryMain";
import SellerEditImages from "../sellerEditImage/SellerEditImages";
import EditMainVariants from "../EditMainVariants/EditMainVariants";
import { validateGoods } from "../../../../code/validation/validationGoods";
import EditLicense from "../EditLicense/EditLicense";
import SellerCategoryAttributesFields from "../../shared/SellerCategoryAttributesFields";
import {
    CATEGORY_SCHEMA_NOT_READY_MESSAGE,
    isCategoryAttributeSchemaReady,
    isProductVariantsValid,
    validateAttributeDraft,
    validateProductVariants,
} from "../../../../utils/sellerProductWizard";

import styles from "./EditGoodsForm.module.scss"
import CheckBox from "../../../../ui/CheckBox/CheckBox";

const FormSection = ({ title, children }) => (
    <section className={styles.formSection}>
        {title ? <h3 className={styles.sectionTitle}>{title}</h3> : null}
        <div className={styles.sectionBody}>{children}</div>
    </section>
);

const EditGoodsForm = () => {
    const navigate = useNavigate();
    const { id } = useParams()

    const [imageErr, setImageErr] = useState(false)
    const [categoryErr, setCategoryErr] = useState(false)
    const [parametersErr, setParametersErr] = useState(false)
    const [varNameErr, setVarNameErr] = useState(false)
    const [varErr, setVarErr] = useState(false)
    const [variantValidation, setVariantValidation] = useState({ name: null, section: null, variants: {} })

    const {
        fetchSellerProductById,
        fetchEditCategoryAttributeSchema,
        fetchEditProductAttributes,
        setParameter,
        setCategory,
        setValues,
        setAttributeValue,
        setAttributeErrors
    } = useActionSellerEdit()

    const {
        product,
        parameters,
        name,
        product_description,
        length,
        width,
        height,
        weight,
        category,
        images,
        variantsName,
        variantsServ,
        category_name,
        status,
        err,
        item,
        barcode,
        additional_details,
        country_of_origin,
        warranty_months,
        vat_rate,
        is_age,
        categoryId,
        attributeSchema,
        attributeValues,
        attributeErrors,
        attributeSchemaStatus
    } = useSelector(state => state.edit_goods)

    const { categoriesStage } = useSelector(state => state.create)
    const authToken = useSelector(state => state.auth.token)

    const { t } = useTranslation('sellerHome')

    const formik = useFormik({
        initialValues: {
            name: "",
            product_description: "",
            length: "",
            width: "",
            height: "",
            weight: "",

            item: item,
            barcode: barcode,
            additional_details: additional_details,
            country_of_origin: country_of_origin,
            warranty_months: warranty_months,
            vat_rate: vat_rate,
            is_age: is_age
        },
        validationSchema: validateGoods,
        onSubmit: (values) => {

            setValues({ ...values })


            navigate(`/seller/edit-preview/${id}`)

        },
    });

    useEffect(() => {
        fetchSellerProductById(id)
    }, [id])

    useEffect(() => {
        if (categoryId && authToken?.access) {
            fetchEditCategoryAttributeSchema(categoryId)
            if (product?.category === categoryId) {
                fetchEditProductAttributes(id)
            }
        }
    }, [categoryId, id, product?.category, authToken?.access])

    const handlePreviewClick = () => {
        const isImagesValid = images.length > 0;
        const isCategoryValid = Boolean(category) || Boolean(category_name);
        const schemaCategory = category || (categoryId ? { id: categoryId } : null)
        const isSchemaReady = isCategoryValid
            ? isCategoryAttributeSchemaReady(schemaCategory, attributeSchema, attributeSchemaStatus)
            : false;
        const nextAttributeErrors = validateAttributeDraft(attributeSchema?.attributes || [], attributeValues || {})
        if (isCategoryValid && !isSchemaReady) {
            nextAttributeErrors.schema = CATEGORY_SCHEMA_NOT_READY_MESSAGE
        }
        const areAttributesValid = Object.keys(nextAttributeErrors).length === 0
        const isParametersValid =
            !parameters?.length ||
            parameters.every(
                (item) => item.name?.trim() && item.value?.trim()
            );
        const nextVariantValidation = validateProductVariants(
            { variantsName, variants: variantsServ },
            t
        );
        const isVariantValid = isProductVariantsValid(nextVariantValidation);

        setCategoryErr(!isCategoryValid);
        setImageErr(!isImagesValid);
        setParametersErr(!isParametersValid)
        setVarNameErr(Boolean(nextVariantValidation.name));
        setVarErr(!isVariantValid);
        setVariantValidation(nextVariantValidation);
        setAttributeErrors(nextAttributeErrors)

        if (isImagesValid && isCategoryValid && isParametersValid && isVariantValid && areAttributesValid) {
            formik.handleSubmit();
        }
    };





    useEffect(() => {
        if (product) {
            // Находим значения параметров в массиве product_parameters

            // Обновляем значения формы
            formik.setValues({
                name: name ?? "",
                product_description: product_description ?? "",
                length: length ?? "", // Используем значение length, если параметр найден
                width: width ?? "",  // Используем значение width, если параметр найден
                height: height ?? "", // Используем значение height, если параметр найден
                weight: weight ?? "",  // Используем значение weight, если параметр найден
                item: item ?? "",
                barcode: barcode ?? "",
                additional_details: additional_details ?? "",
                country_of_origin: country_of_origin ?? "",
                warranty_months: warranty_months ?? "",
                vat_rate: vat_rate ?? "",
                is_age: is_age ?? ""
            });
        }
    }, [product]);


    useEffect(() => {
        const selectedCategory = categoriesStage?.[categoriesStage.length - 1]
        if (selectedCategory) {
            setCategory(selectedCategory)
        }
    }, [categoriesStage])




    return (
        <div className={styles.main}>
            <FormSection>
                <CreateCategoryMain err={categoryErr} setErr={setCategoryErr} category_name={product?.category_name} />

                <CreateFormInp text={t('goods.name')} name="name" value={formik.values.name} {...formik} handleChange={(e) => {
                    formik.handleChange(e)
                    setParameter({ name: "name", value: e.target.value })
                }} titleSize={"big"} required={true} error={formik.errors.name} />
            </FormSection>

            <FormSection title="Media files">
                <SellerEditImages err={imageErr} setErr={setImageErr} />
            </FormSection>

            <FormSection title="Description">
                <CreateFormInp
                    name="product_description"
                    value={formik.values.product_description}
                    {...formik}
                    handleChange={(e) => {
                        formik.handleChange(e)
                        setParameter({ name: "desc", value: e.target.value })
                    }}
                    text={t('goods.description')}
                    titleSize={"small"}
                    required={true}
                    textarea={true}
                    error={formik.errors.product_description}
                />
            </FormSection>

            <FormSection title="Category attributes">
                <SellerCategoryAttributesFields
                    schema={attributeSchema?.attributes || []}
                    values={attributeValues}
                    errors={attributeErrors}
                    loading={attributeSchemaStatus === "pending"}
                    onChange={(attributeId, value) => setAttributeValue({ attributeId, value })}
                />
                <EditGoodsParameters parameters={parameters} err={parametersErr} setErr={setParametersErr} />
            </FormSection>

            <FormSection title="Variants, price and stock">
                <CreateFormInp
                    name='vat_rate'
                    value={formik.values.vat_rate}
                    text={'VAT rate'}
                    titleSize={"small"}
                    {...formik}
                    handleChange={formik.handleChange}
                    error={formik.errors.vat_rate}
                />
                <EditMainVariants
                    err={varErr}
                    setErr={setVarErr}
                    errName={varNameErr}
                    setErrName={setVarNameErr}
                    variantValidation={variantValidation}
                />
            </FormSection>

            <FormSection title="Documents">
                <EditLicense />
            </FormSection>

            <details className={styles.additionalDetails}>
                <summary>Additional seller details</summary>
                <div className={styles.additionalDetailsBody}>
                    <CreateFormInp
                        name="additional_details"
                        value={formik.values.additional_details}
                        {...formik}
                        handleChange={formik.handleChange}
                        text={"Additional details"}
                        titleSize={"small"}
                        textarea={true}
                    />
                    <CreateFormInp
                        name="country_of_origin"
                        value={formik.values.country_of_origin}
                        text="Country of origin"
                        titleSize={"small"}
                        {...formik}
                        handleChange={formik.handleChange}
                    />
                    <CreateFormInp
                        name="warranty_months"
                        value={formik.values.warranty_months}
                        text="Warranty, months"
                        titleSize={"small"}
                        {...formik}
                        handleChange={formik.handleChange}
                        error={formik.errors.warranty_months}
                        num={true}
                    />
                    <CreateFormInp
                        name='barcode'
                        value={formik.values.barcode}
                        text="EAN/UPC barcode"
                        titleSize={"small"}
                        {...formik}
                        handleChange={formik.handleChange}
                    />
                    <CreateFormInp
                        name='item'
                        value={formik.values.item}
                        text="Seller article"
                        titleSize={"small"}
                        {...formik}
                        handleChange={formik.handleChange}
                        error={formik.errors.item}
                    />
                    <label className={styles.isAgeLabel}>
                        <CheckBox
                            check={is_age}
                            onChange={(v) => {
                                setValues({ is_age: v })
                                formik.setFieldValue("is_age", v)
                            }}
                            style={{ borderRadius: "4px" }}
                        />
                        Age restricted
                    </label>
                </div>
            </details>


            <div className={styles.footerBtnWrap}>
                <button onClick={() => navigate(-1)}>{t('item.cancel')}</button>
                <button
                    disabled={!formik.isValid}
                    onClick={() => {
                        handlePreviewClick()
                    }}>{t('item.preview')}</button>
            </div>
        </div>
    )
}

export default EditGoodsForm
