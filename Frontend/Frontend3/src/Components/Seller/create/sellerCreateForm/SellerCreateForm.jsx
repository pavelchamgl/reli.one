import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";

import CreateFormInp from "../../../../ui/Seller/create/createFormInp/CreateFormInp";
import CreateCharacInp from "../../../../ui/Seller/create/createCharacteristicsInp/CreateCharacInp";
import SellerCreateImage from "../sellerCreateImages/SellerCreateImage";
import SellerCreateVariants from "../sellerCreateVariants/SellerCreateVariants";
import CreateCategoryMain from "../../../../ui/Seller/create/createCategory/createCategoryMain/CreateCategoryMain";

import styles from "./SellerCreateForm.module.scss";

const SellerCreateForm = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {},
    onSubmit: (values) => {
      console.log(values);
    },
  });

  return (
    <div className={styles.main}>
      <CreateFormInp text={"Goods name"} titleSize={"big"} required={true} />

      <SellerCreateImage />
      <CreateCategoryMain />

      <CreateFormInp
        text={"Description text"}
        titleSize={"small"}
        required={true}
        textarea={true}
      />

      <CreateCharacInp />

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

      <CreateFormInp text={"Package length, mm"} titleSize={"small"} />
      <CreateFormInp text={"Package width, mm"} titleSize={"small"} />
      <CreateFormInp text={"Package height, mm"} titleSize={"small"} />
      <CreateFormInp text={"Weight with package, g"} titleSize={"small"} />


      <SellerCreateVariants />

      <div className={styles.footerBtnWrap}>
        <button>Cancel</button>
        <button onClick={() => navigate("/seller-preview")}>Preview</button>
      </div>
    </div>
  );
};

export default SellerCreateForm;
