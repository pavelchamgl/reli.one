import personalIc from "../../../../../assets/Seller/register/personalDetailIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller";
import SellerDateInp from "../dateInp/DateInp";
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect";
import UploadInp from "../uploadInp/UploadInp";
import styles from './PersonalDetails.module.scss';

const PersonalDetails = () => {
  return (
    <div className={styles.main}>

      <div className={styles.titleWrap}>
        <img src={personalIc} alt="" />
        <h2>Personal Details</h2>
      </div>

      <div className={styles.inpWrapMain}>
        <div className={styles.twoInpWrap}>
          <InputSeller title={"First name"} type={"text"} circle={true} required={true} />
          <InputSeller title={"Last name"} type={"text"} circle={true} required={true} />
        </div>

        <div className={styles.twoInpWrap}>
          <SellerDateInp />
          <InputSeller title={"Phone"} type={"tel"} circle={true} required={true} />
        </div>

        <SellerInfoSellect />

        <UploadInp second={true} />
      </div>


    </div>
  )
}

export default PersonalDetails