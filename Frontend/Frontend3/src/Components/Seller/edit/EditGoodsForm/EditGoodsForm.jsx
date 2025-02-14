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

const EditGoodsForm = () => {
    const navigate = useNavigate();
    const { id } = useParams()


    const { fetchSellerProductById, setParameter, setCategory } = useActionSellerEdit()

    const { product, parameters, name, product_description, length, width, height, weight } = useSelector(state => state.edit_goods)

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
        onSubmit: (values) => {


        },
    });



    useEffect(() => {
        fetchSellerProductById(id)
    }, [id])



    console.log(product);

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
            }} titleSize={"big"} required={true} />

            <SellerEditImages />

            <CreateCategoryMain category_name={product?.category_name} />

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
            />

            <EditGoodsParameters parameters={parameters} />


            <CreateFormInp text={"Barcode"} titleSize={"small"} />
            <CreateFormInp text={"Item"} titleSize={"small"} required={true} />

            <h4 className={styles.wightTitle}>Dimensions and weight</h4>

            <CreateFormInp name={"length"} value={formik.values.length} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "length", value: e.target.value })
            }} text={"Package length, mm"} titleSize={"small"} />
            <CreateFormInp name={"width"} value={formik.values.width} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "width", value: e.target.value })
            }} text={"Package width, mm"} titleSize={"small"} />
            <CreateFormInp name={"height"} value={formik.values.height} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "height", value: e.target.value })
            }} text={"Package height, mm"} titleSize={"small"} />
            <CreateFormInp name={"weight"} value={formik.values.weight} {...formik} handleChange={(e) => {
                formik.handleChange(e)
                setParameter({ name: "weight", value: e.target.value })
            }} text={"Weight with package, g"} titleSize={"small"} />

            <EditMainVariants />


            <div className={styles.footerBtnWrap}>
                <button onClick={() => navigate(-1)}>Cancel</button>
                <button onClick={() => navigate(`/seller/edit-preview/${id}`)}>Preview</button>
            </div>
        </div>
    )
}

export default EditGoodsForm