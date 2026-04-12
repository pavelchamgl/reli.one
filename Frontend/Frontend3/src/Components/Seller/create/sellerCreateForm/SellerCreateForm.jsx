import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { postSellerProduct, postSellerImages, postSellerParameters, postSellerVariants } from "../../../../api/seller/sellerProduct";
import { useActionCreatePrev } from "../../../../hook/useActionCreatePrev";
import { validateGoods } from "../../../../code/validation/validationGoods";
import CreateFormInp from "../../../../ui/Seller/create/createFormInp/CreateFormInp";
import CreateCharacInp from "../../../../ui/Seller/create/createCharacteristicsInp/CreateCharacInp";
import SellerCreateImage from "../sellerCreateImages/SellerCreateImage";
import SellerCreateVariants from "../sellerCreateVariants/SellerCreateVariants";
import CreateCategoryMain from "../../../../ui/Seller/create/createCategory/createCategoryMain/CreateCategoryMain";
import CreateLisence from "../createLisence/CreateLisence"

import styles from "./SellerCreateForm.module.scss";
import CheckBox from "../../../../ui/CheckBox/CheckBox";

const
  SellerCreateForm = () => {
    const navigate = useNavigate();

    const [files, setFiles] = useState([])
    const [parameters, setParameters] = useState([])
    const [variants, setVariants] = useState([])
    const [imageErr, setImageErr] = useState(false)
    const [categoryErr, setCategoryErr] = useState(false)
    const [parametersErr, setParametersErr] = useState(false)
    const [varNameErr, setVarNameErr] = useState(false)
    const [varErr, setVarErr] = useState(false)
    const [type, setType] = useState(null)


    const { name, lengthMain, product_description, widthMain, heightMain, weightMain, category, variantsName, variantsMain, images, product_parameters, item, barcode, additional_details, vat_rate, is_age } = useSelector(state => state.create_prev)

    const { setName, setDescription, setCategory, setParametersPrev, setLength, setWidth, setHeigth, setWeight, setValues } = useActionCreatePrev()

    const { categoriesStage } = useSelector(state => state.create)

    const { t } = useTranslation('sellerHome')



    const formik = useFormik({
      initialValues: {
        name: name ? name : "",
        product_description: product_description ? product_description : "",
        length: lengthMain ? lengthMain : "",
        width: widthMain ? widthMain : "",
        height: heightMain ? heightMain : "",
        weight: weightMain ? weightMain : "",
        item: item,
        barcode: barcode,
        additional_details: additional_details,
        vat_rate: vat_rate,
        is_age: is_age
      },
      validationSchema: validateGoods,
      onSubmit: (values) => {

        setValues({ ...values })



        navigate("/seller/seller-preview")
      },
    });

    // ? preview

    useEffect(() => {
      setCategory(categoriesStage[categoriesStage?.length - 1])
    }, [categoriesStage])


    useEffect(() => {
      setParametersPrev([...parameters])

    }, [parameters]);

    const handlePreviewClick = () => {
      const isImagesValid = images.length > 0;
      const isCategoryValid = Boolean(category);
      const isParametersValid =
        product_parameters?.length > 0 &&
        product_parameters.every(
          (item) => item.name?.trim() && item.value?.trim()
        );
      const isVarNameErrValid = variantsName.length > 0
      let isVariantValid;

      if (type === "text") {
        isVariantValid =
          variantsMain?.length > 0 &&
          variantsMain.every(
            (item) =>
              item.price?.trim() &&
              !isNaN(Number(item.price)) &&
              item.text?.trim()
          );
      } else {
        isVariantValid =
          variantsMain?.length > 0 &&
          variantsMain.every(
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





    return (
      <div className={styles.main}>
        <CreateFormInp text={t('goods.name')} name="name" value={formik.values.name} {...formik} handleChange={(e) => {
          setName({ name: e.target.value })
          formik.handleChange(e)
        }} titleSize={"big"} required={true} error={formik.errors.name} />

        <SellerCreateImage setErr={setImageErr} err={imageErr} setFilesMain={setFiles} />
        <CreateLisence />

        <CreateCategoryMain err={categoryErr} setErr={setCategoryErr} />

        <CreateFormInp
          name="product_description"
          value={formik.values.product_description}
          {...formik}
          handleChange={(e) => {
            setDescription(e.target.value)
            formik.handleChange(e)
          }}
          text={t('goods.description')}
          titleSize={"small"}
          required={true}
          textarea={true}
          error={formik.errors.product_description}
        />

        <CreateCharacInp err={parametersErr} setErr={setParametersErr} setParameters={setParameters} />

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

        {/* <div className={styles.priceDiv}>
        <CreateFormInp
          text={"Your price"}
          titleSize={"small"}
          required={true}
          style={{ width: "calc(100vw)" }}
        />
        <CreateFormInp
          style={{ width: "calc(100vw / 2 - 100px)" }}
          text={"Discounted price"}
          titleSize={"small"}
        />
      </div> */}

        <h4 className={styles.wightTitle}>{t('item.dimensions_weight')}</h4>

        <CreateFormInp name={"length"}
          value={formik.values.length}
          {...formik} handleChange={(e) => {
            formik.handleChange(e)
            setLength({ length: e.target.value })
          }} text={t('item.package_length')}
          titleSize={"small"}
          error={formik.errors.length}
          num={true}
        />

        <CreateFormInp name={"width"}
          value={formik.values.width} {
          ...formik} handleChange={(e) => {
            formik.handleChange(e)
            setWidth({ width: e.target.value })
          }} text={t('item.package_width')}
          titleSize={"small"}
          error={formik.errors.width}
          num={true}
        />

        <CreateFormInp name={"height"}
          value={formik.values.height}
          {...formik} handleChange={(e) => {
            formik.handleChange(e)
            setHeigth({ height: e.target.value })
          }} text={t('item.package_height')}
          titleSize={"small"}
          error={formik.errors.height}
          num={true}
        />

        <CreateFormInp name={"weight"}
          value={formik.values.weight}
          {...formik} handleChange={(e) => {
            formik.handleChange(e)
            setWeight({ weight: e.target.value })
          }} text={t('item.package_weight')}
          titleSize={"small"}
          error={formik.errors.weight}

          num={true} />


        <SellerCreateVariants err={varErr} setErr={setVarErr} type={type} setType={setType} errName={varNameErr} setErrName={setVarNameErr} setMainVariants={setVariants} />

        <div className={styles.footerBtnWrap}>
          <button onClick={() => navigate(-1)}>{t('item.cancel')}</button>

          <button
            disabled={!formik.isValid || !variantsName?.trim() || variantsMain.length === 0}
            onClick={handlePreviewClick}>{t('item.preview')}</button>
        </div >
      </div >
    );
  };

export default SellerCreateForm;
