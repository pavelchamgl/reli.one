
import { useEffect, useState } from "react";

import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed";
import personalIc from "../../../../../assets/Seller/register/personalDetailIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller";
import SellerDateInp from "../dateInp/DateInp";
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect";
import UploadInp from "../uploadInp/UploadInp";

import styles from './PersonalDetails.module.scss';
import { useSelector } from "react-redux";

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
  }, [nationality])


  return (
    <div className={styles.main}>

      <div className={styles.titleWrap}>
        <img src={personalIc} alt="" />
        <h2>Personal Details</h2>
      </div>

      <div className={styles.inpWrapMain}>
        <div className={styles.twoInpWrap}>
          <InputSeller title={"First name"} type={"text"} circle={true} required={true} placeholder={"First name"} name="first_name" value={formik.values.first_name} onChange={formik.handleChange} onBlur={formik.handleBlur} />
          <InputSeller title={"Last name"} type={"text"} circle={true} required={true} placeholder={"Last name"} name="last_name" value={formik.values.last_name} onChange={formik.handleChange} onBlur={formik.handleBlur} />
        </div>

        <div className={styles.twoInpWrap}>
          <SellerDateInp formik={formik} />
          <InputSeller title={"Phone"} type={"tel"} circle={true} required={true} num={true} placeholder={"Personal phone"} name="personal_phone" value={formik.values.personal_phone} onChange={formik.handleChange} onBlur={formik.handleBlur} />
        </div>

        <SellerInfoSellect arr={nationalArr} title={"Nationality"} titleSellect={"Select nationality"} value={nationality} setValue={setNationality} />

        <UploadInp second={true} />
      </div>


    </div>
  )
}

export default PersonalDetails