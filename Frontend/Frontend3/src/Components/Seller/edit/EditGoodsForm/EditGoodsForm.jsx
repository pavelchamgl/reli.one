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
import EditVariants from "../editVariants/EditVariants";
import EditMainVariants from "../EditMainVariants/EditMainVariants";
import { validateGoods } from "../../../../code/validation/validationGoods";
import EditLicense from "../EditLicense/EditLicense";
import SellerCategoryAttributesFields from "../../shared/SellerCategoryAttributesFields";
import {
    areOptionalPackageDimensionsValid,
    CATEGORY_SCHEMA_NOT_READY_MESSAGE,
    isCategoryAttributeSchemaReady,
    validateAttributeDraft
} from "../../../../utils/sellerProductWizard";

import styles from "./EditGoodsForm.module.scss"
import CheckBox from "../../../../ui/CheckBox/CheckBox";

const EditGoodsForm = () => {
    const navigate = useNavigate();
    const { id } = useParams()

    const [imageErr, setImageErr] = useState(false)
    const [categoryErr, setCategoryErr] = useState(false)
    const [parametersErr, setParametersErr] = useState(false)
    const [varNameErr, setVarNameErr] = useState(false)
    const [varErr, setVarErr] = useState(false)
    const [type, setType] = useState(null)

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
        vat_rate,
        is_age,
        categoryId,
        attributeSchema,
        attributeValues,
        attributeErrors,
        attributeSchemaStatus
    } = useSelector(state => state.edit_goods)

    const { categoriesStage } = useSelector(state => state.create)

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
        if (categoryId) {
            fetchEditCategoryAttributeSchema(categoryId)
            if (product?.category === categoryId) {
                fetchEditProductAttributes(id)
            }
        }
    }, [categoryId, id, product?.category])

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
            parameters?.length > 0 &&
            parameters.every(
                (item) => item.name?.trim() && item.value?.trim()
            );
        const isVarNameErrValid = variantsName.length > 0
        let isVariantValid;

        if (type === "text") {
            isVariantValid =
                variantsServ?.length > 0 &&
                variantsServ.every(
                    (item) =>
                        item.price?.trim() &&
                        !isNaN(Number(item.price)) &&
                        item.text?.trim() &&
                        areOptionalPackageDimensionsValid(item)
                );
        } else {
            isVariantValid =
                variantsServ?.length > 0 &&
                variantsServ.every(
                    (item) =>
                        item.price?.trim() &&
                        !isNaN(Number(item.price)) &&
                        item.image?.trim() &&
                        areOptionalPackageDimensionsValid(item)
                );
        }


        setCategoryErr(!isCategoryValid);
        setImageErr(!isImagesValid);
        setParametersErr(!isParametersValid)
        setVarNameErr(!isVarNameErrValid)
        setVarErr(!isVariantValid)
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
            <CreateFormInp text={t('goods.name')} name="name" value={formik.values.name} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "name", value: e.target.value })
            }} titleSize={"big"} required={true} error={formik.errors.name} />

            <SellerEditImages err={imageErr} setErr={setImageErr} />

            <EditLicense />

            <CreateCategoryMain err={categoryErr} setErr={setCategoryErr} category_name={product?.category_name} />

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

            <EditGoodsParameters parameters={parameters} err={parametersErr} setErr={setParametersErr} />

            <SellerCategoryAttributesFields
                schema={attributeSchema?.attributes || []}
                values={attributeValues}
                errors={attributeErrors}
                loading={attributeSchemaStatus === "pending"}
                onChange={(attributeId, value) => setAttributeValue({ attributeId, value })}
            />


            <CreateFormInp
                name='barcode'
                value={formik.values.barcode}
                text={t('item.barcode')}
                titleSize={"small"}
                {...formik}
                handleChange={(e) => {
                    setDescription(e.target.value)
                    formik.handleChange(e)
                }}

            />
            <CreateFormInp
                name='item'
                value={formik.values.item}
                text={t('item.name')}
                titleSize={"small"}
                {...formik}
                handleChange={formik.handleChange}
                required={true}
                error={formik.errors.item}
            />

            <CreateFormInp
                name="additional_details"
                value={formik.values.additional_details}
                {...formik}
                handleChange={(e) => {
                    formik.handleChange(e)
                }}
                text={"Additional details"}
                // text={t('goods.description')}
                titleSize={"small"}
                textarea={true}
            />

            <CreateFormInp
                name='vat_rate'
                value={formik.values.vat_rate}
                // text={t('item.name')}
                text={'Vat rate'}
                titleSize={"small"}
                {...formik}
                handleChange={formik.handleChange}
                required={true}
                error={formik.errors.vat_rate}
            />

            <label className={styles.isAgeLabel}>
                <CheckBox check={is_age} onChange={(v) => setValues({ is_age: v })} style={{ borderRadius: "4px" }} />
                Is age restricted (18+)
            </label>

            <h4 className={styles.wightTitle}>{t('item.dimensions_weight')}</h4>

            <CreateFormInp name={"length"} value={formik.values.length} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "length", value: e.target.value })
            }} text={t('item.package_length')}
                titleSize={"small"}
                error={formik.errors.length}
                num={true}
            />

            <CreateFormInp name={"width"} value={formik.values.width} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "width", value: e.target.value })
            }} text={t('item.package_width')}
                titleSize={"small"}
                error={formik.errors.width}
                num={true}
            />
            <CreateFormInp name={"height"} value={formik.values.height} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "height", value: e.target.value })
            }} text={t('item.package_height')}
                titleSize={"small"}
                error={formik.errors.height}
                num={true}
            />

            <CreateFormInp name={"weight"} value={formik.values.weight} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "weight", value: e.target.value })
            }} text={t('item.package_weight')}
                titleSize={"small"}
                error={formik.errors.weight}
                num={true}
            />

            <EditMainVariants type={type} setType={setType} err={varErr} setErr={setVarErr} errName={varNameErr} setErrName={setVarNameErr} />


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
