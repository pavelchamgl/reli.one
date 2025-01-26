import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";

import CreateFormInp from "../../../../ui/Seller/create/createFormInp/CreateFormInp";
import CreateCharacInp from "../../../../ui/Seller/create/createCharacteristicsInp/CreateCharacInp";

import styles from "./SellerCreateForm.module.scss";
import SellerCreateImage from "../sellerCreateImages/SellerCreateImage";

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

      <CreateCharacInp />

      <CreateFormInp
        text={"Description text"}
        titleSize={"small"}
        required={true}
        textarea={true}
      />
      <CreateFormInp text={"Barcode"} titleSize={"small"} />
      <CreateFormInp text={"Item"} titleSize={"small"} required={true} />
      <div className={styles.priceDiv}>
        <CreateFormInp
          text={"Your price"}
          titleSize={"small"}
          required={true}
          style={{ width: "calc(100vw / 2 - 100px)" }}
        />
        <CreateFormInp
          style={{ width: "calc(100vw / 2 - 100px)" }}
          text={"Discounted price"}
          titleSize={"small"}
        />
      </div>
      <CreateFormInp text={"Package length, mm"} titleSize={"small"} />
      <CreateFormInp text={"Package width, mm"} titleSize={"small"} />
      <CreateFormInp text={"Package height, mm"} titleSize={"small"} />
      <CreateFormInp text={"Weight with package, g"} titleSize={"small"} />

      <div className={styles.footerBtnWrap}>
        <button>Cancel</button>
        <button onClick={() => navigate("/seller-preview")}>Preview</button>
      </div>
    </div>
  );
};

export default SellerCreateForm;
