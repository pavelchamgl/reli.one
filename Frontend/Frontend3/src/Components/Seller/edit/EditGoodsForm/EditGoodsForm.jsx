import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit";
import { useSelector } from "react-redux";

import EditGoodsParameters from "../editGoodsParameters/EditGoodsParameters";
import CreateFormInp from "../../../../ui/Seller/create/createFormInp/CreateFormInp";
import CreateCategoryMain from "../../../../ui/Seller/create/createCategory/createCategoryMain/CreateCategoryMain";
import SellerEditImages from "../sellerEditImage/SellerEditImages";

import styles from "./EditGoodsForm.module.scss"
import EditVariants from "../editVariants/EditVariants";
import EditMainVariants from "../EditMainVariants/EditMainVariants";
import { validateGoods } from "../../../../code/validation/validationGoods";
import { ErrToast } from "../../../../ui/Toastify";
import EditLicense from "../EditLicense/EditLicense";

const EditGoodsForm = () => {
    const navigate = useNavigate();
    const { id } = useParams()

    const [imageErr, setImageErr] = useState(false)
    const [categoryErr, setCategoryErr] = useState(false)
    const [parametersErr, setParametersErr] = useState(false)
    const [varNameErr, setVarNameErr] = useState(false)
    const [varErr, setVarErr] = useState(false)
    const [type, setType] = useState(null)

    const { fetchSellerProductById, setParameter, setCategory } = useActionSellerEdit()

    const { product, parameters, name, product_description, length, width, height, weight, category, images, variantsName, variantsServ, category_name, status, err } = useSelector(state => state.edit_goods)

    const { categoriesStage } = useSelector(state => state.create)

    const formik = useFormik({
        initialValues: {
            name: "",
            product_description: "",
            length: "",
            width: "",
            height: "",
            weight: ""
        },
        validationSchema: validateGoods,
        onSubmit: (values) => {

            navigate(`/seller/edit-preview/${id}`)

        },
    });

    useEffect(() => {
        fetchSellerProductById(id)
    }, [id])

    const handlePreviewClick = () => {
        const isImagesValid = images.length > 0;
        const isCategoryValid = Boolean(category) || Boolean(category_name);
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
                        item.text?.trim()
                );
        } else {
            isVariantValid =
                variantsServ?.length > 0 &&
                variantsServ.every(
                    (item) =>
                        item.price?.trim() &&
                        !isNaN(Number(item.price)) &&
                        item.image?.trim()
                );
        }



        setCategoryErr(!isCategoryValid);
        setImageErr(!isImagesValid);
        setParametersErr(!isParametersValid)
        setVarNameErr(!isVarNameErrValid)
        setVarErr(!isVariantValid)

        if (isImagesValid && isCategoryValid && isParametersValid && isVariantValid) {
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
                weight: weight ?? ""  // Используем значение weight, если параметр найден
            });
        }
    }, [product]);


    useEffect(() => {
        setCategory(categoriesStage[categoriesStage?.length - 1])
    }, [categoriesStage])




    return (
        <div className={styles.main}>
            <CreateFormInp text={"Goods name"} name="name" value={formik.values.name} {...formik} handleChange={(e) => {
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
                text={"Description text"}
                titleSize={"small"}
                required={true}
                textarea={true}
                error={formik.errors.product_description}
            />

            <EditGoodsParameters parameters={parameters} err={parametersErr} setErr={setParametersErr} />


            <CreateFormInp text={"Barcode"} titleSize={"small"} />
            <CreateFormInp text={"Item"} titleSize={"small"} required={true} />

            <h4 className={styles.wightTitle}>Dimensions and weight</h4>

            <CreateFormInp name={"length"} value={formik.values.length} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "length", value: e.target.value })
            }} text={"Package length, mm"} titleSize={"small"} error={formik.errors.length} />
            <CreateFormInp name={"width"} value={formik.values.width} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "width", value: e.target.value })
            }} text={"Package width, mm"} titleSize={"small"} error={formik.errors.width} />
            <CreateFormInp name={"height"} value={formik.values.height} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "height", value: e.target.value })
            }} text={"Package height, mm"} titleSize={"small"} error={formik.errors.height} />
            <CreateFormInp name={"weight"} value={formik.values.weight} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "weight", value: e.target.value })
            }} text={"Weight with package, g"} titleSize={"small"} error={formik.errors.weight} />

            <EditMainVariants type={type} setType={setType} err={varErr} setErr={setVarErr} errName={varNameErr} setErrName={setVarNameErr} />


            <div className={styles.footerBtnWrap}>
                <button onClick={() => navigate(-1)}>Cancel</button>
                <button
                    disabled={!formik.isValid}
                    onClick={() => {
                        handlePreviewClick()
                    }}>Preview</button>
            </div>
        </div>
    )
}

export default EditGoodsForm