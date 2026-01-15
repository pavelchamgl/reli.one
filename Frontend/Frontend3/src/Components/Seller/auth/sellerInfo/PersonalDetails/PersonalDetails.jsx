
import { useEffect, useState } from "react";

import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed";
import personalIc from "../../../../../assets/Seller/register/personalDetailIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller";
import SellerDateInp from "../dateInp/DateInp";
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect";
import UploadInp from "../uploadInp/UploadInp";

import styles from './PersonalDetails.module.scss';
import { useSelector } from "react-redux";
import { uploadSingleDocument } from "../../../../../api/seller/onboarding";
import { ErrToast } from "../../../../../ui/Toastify";

const PersonalDetails = ({ formik }) => {

  const { selfData } = useSelector(state => state.selfEmploed)

  const [nationality, setNationality] = useState(selfData.nationality)


  const nationalArr = [
    { text: "Czech Republic", value: "cz" },
    { text: "Germany", value: "de" },
    { text: "France", value: "fr" },
    { text: "Poland", value: "pl" },
    { text: "United Kingdom", value: "gb" }
  ];

  const { safeData } = useActionSafeEmploed()

  useEffect(() => {
    safeData({ nationality: nationality })
    formik.setFieldValue("nationality", nationality)
  }, [nationality])

  const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
    uploadSingleDocument({ file, doc_type, scope, side })
      .then(res => {

        if (res.side === "front") {
          formik.setFieldValue("uploadFront", res.uploaded_at)
        }

        if (res.side === "back") {
          formik.setFieldValue("uploadBack", res.uploaded_at)
        }

        console.log("Документ загружен", res);
      })
      .catch(err => {
        ErrToast(err.message)
        console.log("Ошибка загрузки", err);
      });
  };


  const handleSingleBackUpload = ({ file, doc_type, scope, side }) => {
    const formData = new FormData();

    formData.append("doc_type", doc_type);
    formData.append("scope", scope);
    formData.append("side", side);
    formData.append("file", file);

    api.post("/kyc/documents/upload", formData);
  };


  return (
    <div className={styles.main}>

      <div className={styles.titleWrap}>
        <img src={personalIc} alt="" />
        <h2>Personal Details</h2>
      </div>

      <div className={styles.inpWrapMain}>
        <div className={styles.twoInpWrap}>
          <InputSeller title={"First name"} type={"text"} circle={true} required={true}
            placeholder={"First name"}
            name="first_name"
            value={formik.values.first_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.first_name}
          />

          <InputSeller title={"Last name"} type={"text"} circle={true} required={true}
            placeholder={"Last name"}
            name="last_name"
            value={formik.values.last_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.last_name}
          />
        </div>

        <div className={styles.twoInpWrap}>
          <SellerDateInp formik={formik} />
          <InputSeller title={"Phone"} type={"tel"} circle={true} required={true} num={true}
            placeholder={"Personal phone"}
            name="personal_phone"
            value={formik.values.personal_phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.personal_phone}
          />
        </div>

        <SellerInfoSellect arr={nationalArr}
          title={"Nationality"}
          titleSellect={"Select nationality"}
          value={nationality}
          setValue={setNationality}
          errText={"Nationality is required"}
        />

        <div>
          <UploadInp title={"Identity document"} description={"Passport or National ID"}
            scope={"self_employed_personal"}
            docType={"identity_document"}
            side={"front"}
            onChange={handleSingleFrontUpload}
            inpText={"Upload front side"}
          />

          <UploadInp scope={"self_employed_personal"} docType={"identity_document"}
            side={"back"}
            onChange={handleSingleFrontUpload}
            inpText={"Upload back side"}
          />
          {(formik.touched.uploadFront || formik.touched.uploadBack) &&
            (formik.errors.uploadFront || formik.errors.uploadBack) && (
              <p className={styles.errorText}>
                {formik.errors.uploadFront || formik.errors.uploadBack}
              </p>
            )}

        </div>

      </div>


    </div>
  )
}

export default PersonalDetails