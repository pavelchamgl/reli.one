import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { postSellerProduct, postSellerImages, postSellerParameters, postSellerVariants } from "../../../../api/seller/sellerProduct";

import CreateFormInp from "../../../../ui/Seller/create/createFormInp/CreateFormInp";
import CreateCharacInp from "../../../../ui/Seller/create/createCharacteristicsInp/CreateCharacInp";
import SellerCreateImage from "../sellerCreateImages/SellerCreateImage";
import SellerCreateVariants from "../sellerCreateVariants/SellerCreateVariants";
import CreateCategoryMain from "../../../../ui/Seller/create/createCategory/createCategoryMain/CreateCategoryMain";

import styles from "./SellerCreateForm.module.scss";
import { useActionCreatePrev } from "../../../../hook/useActionCreatePrev";

const SellerCreateForm = () => {
  const navigate = useNavigate();

  const [files, setFiles] = useState([])
  const [parameters, setParameters] = useState([])
  const [variants, setVariants] = useState([])

  const { name, lengthMain, product_description, widthMain, heightMain, weightMain } = useSelector(state => state.create_prev)

  const { setName, setDescription, setCategory, setParametersPrev, setLength, setWidth, setHeigth, setWeight } = useActionCreatePrev()

  const { categoriesStage } = useSelector(state => state.create)




  const formik = useFormik({
    initialValues: {
      name: name ? name : "",
      product_description: product_description ? product_description : "",
      length: lengthMain ? lengthMain : "",
      width: widthMain ? widthMain : "",
      height: heightMain ? heightMain : "",
      weight: weightMain ? weightMain : ""
    },
    onSubmit: (values) => {

      console.log(values);


      navigate("/seller/seller-preview")
    },
  });

  // ? preview

  useEffect(() => {
    setCategory(categoriesStage[categoriesStage?.length - 1])
  }, [categoriesStage])

  const { height, length, weight, width } = formik.values

  useEffect(() => {
    const newParams = [
      { name: "length", value: length },
      { name: "height", value: height },
      { name: "width", value: width },
      { name: "weight", value: weight }
    ].filter(param => param.value); // Убираем пустые значения

    if (newParams.length > 0) { // Добавляем только если есть непустые значения
      setParametersPrev([...parameters, ...newParams]);
    } else {
      setParametersPrev([...parameters])
    }
  }, [parameters, length, height, width, weight]);


  useEffect(() => {
    console.log(lengthMain);

  }, [lengthMain])

  return (
    <div className={styles.main}>
      <CreateFormInp text={"Goods name"} name="name" value={formik.values.name} {...formik} handleChange={(e) => {
        setName({ name: e.target.value })
        formik.handleChange(e)
      }} titleSize={"big"} required={true} />

      <SellerCreateImage setFilesMain={setFiles} />
      <CreateCategoryMain />

      <CreateFormInp
        name="product_description"
        value={formik.values.product_description}
        {...formik}
        handleChange={(e) => {
          setDescription(e.target.value)
          formik.handleChange(e)
        }}
        text={"Description text"}
        titleSize={"small"}
        required={true}
        textarea={true}
      />

      <CreateCharacInp setParameters={setParameters} />

      <CreateFormInp text={"Barcode"} titleSize={"small"} />
      <CreateFormInp text={"Item"} titleSize={"small"} required={true} />
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

      <h4 className={styles.wightTitle}>Dimensions and weight</h4>

      <CreateFormInp name={"length"} value={formik.values.length} {...formik} handleChange={(e) => {
        formik.handleChange(e)
        setLength({ length: e.target.value })
      }} text={"Package length, mm"} titleSize={"small"} />
      <CreateFormInp name={"width"} value={formik.values.width} {...formik} handleChange={(e) => {
        formik.handleChange(e)
        setWidth({ width: e.target.value })
      }} text={"Package width, mm"} titleSize={"small"} />
      <CreateFormInp name={"height"} value={formik.values.height} {...formik} handleChange={(e) => {
        formik.handleChange(e)
        setHeigth({ height: e.target.value })
      }} text={"Package height, mm"} titleSize={"small"} />
      <CreateFormInp name={"weight"} value={formik.values.weight} {...formik} handleChange={(e) => {
        formik.handleChange(e)
        setWeight({ weight: e.target.value })
      }} text={"Weight with package, g"} titleSize={"small"} />


      <SellerCreateVariants  setMainVariants={setVariants} />

      <div className={styles.footerBtnWrap}>
        <button>Cancel</button>
        <button onClick={() => { formik.handleSubmit() }}>Preview</button>
      </div>
    </div>
  );
};

export default SellerCreateForm;
