
import { useRef } from "react";
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { useActionSafeEmploed } from "../../../../../hook/useActionSafeEmploed";
import personalIc from "../../../../../assets/Seller/register/personalDetailIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller";
import SellerDateInp from "../dateInp/DateInp";
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect";
import UploadInp from "../uploadInp/UploadInp";
import { putPersonalData, uploadSingleDocument } from "../../../../../api/seller/onboarding";
import { ErrToast } from "../../../../../ui/Toastify";
import { countriesArr, toISODate } from "../../../../../code/seller";

import styles from './PersonalDetails.module.scss';
import IdentDocumInp from "../../identDocumInp/IdentDocumInp";

const PersonalDetails = ({ formik, onClosePreview }) => {

  const { selfData } = useSelector(state => state.selfEmploed)
  const { safeData, setRegisterData } = useActionSafeEmploed()

  const isPersonalDataFilled = (values) => {
    return Boolean(
      values.first_name &&   
      values.last_name &&
      values.date_of_birth &&
      values.personal_phone
    )
  }

  const personalRef = useRef(null)

  const { pathname } = useLocation()

  const { t } = useTranslation('onbording')


  const onLeavePersonalBlock = async () => {
    const filled = isPersonalDataFilled(formik.values);



    if (!filled) return;

    const payload = {
      first_name: formik.values.first_name,
      last_name: formik.values.last_name,
      date_of_birth: formik.values?.date_of_birth,
      nationality: formik.values.nationality,
      personal_phone: formik.values.personal_phone,
      wProof_document_issue_date: toISODate(formik.values.uploadFront),
    };

    if (pathname === '/seller/seller-review') {
      safeData(payload)
    }

    localStorage.setItem('first_name', JSON.stringify(payload.first_name))
    localStorage.setItem('last_name', JSON.stringify(payload.last_name))
    localStorage.setItem('phone', JSON.stringify(payload.personal_phone))
    try {
      await putPersonalData({
        date_of_birth: payload.date_of_birth?.split(".").reverse().join("-"),
        nationality: payload.nationality,
        personal_phone: payload.personal_phone,
      });

      onClosePreview?.();
    } catch (err) {
      // ErrToast(err?.message || "Failed to save personal data");
    }
  };

  const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
    uploadSingleDocument({ file, doc_type, scope, side })
      .then(res => {

        if (res.side === "front") {
          formik.setFieldValue("uploadFront", res.uploaded_at)
        }

        if (res.side === "back") {
          formik.setFieldValue("uploadBack", res.uploaded_at)
        }

      })
      .catch(err => {
        ErrToast(err.message)
      });
  };

  const ignoreBlurRef = useRef(false);

  return (
    <div className={styles.main}
      ref={personalRef}
      tabIndex={-1}
      onBlurCapture={(e) => {
        if (ignoreBlurRef.current) {
          ignoreBlurRef.current = false;
          return;
        }
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setTimeout(onLeavePersonalBlock, 0);
        }
      }}>

      <div className={styles.titleWrap}>
        <img src={personalIc} alt="" />
        <h2>{t('onboard.seller_info.personal_details')}</h2>
      </div>

      <div className={styles.inpWrapMain}>
        <div className={styles.twoInpWrap}>
          <InputSeller
            title={t('onboard.seller_info.first_name')}
            type={"text"} circle={true} required={true}
            placeholder={t('onboard.seller_info.first_name')}
            name="first_name"
            value={formik.values.first_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.first_name}
            touched={formik.touched.first_name}
          />

          <InputSeller
            title={t('onboard.seller_info.last_name')}
            type={"text"} circle={true} required={true}
            placeholder={t('onboard.seller_info.last_name')}
            name="last_name"
            value={formik.values.last_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.last_name}
            touched={formik.touched.last_name}
          />
        </div>

        <div className={styles.twoInpWrap}>
          <SellerDateInp formik={formik} />
          <InputSeller
            title={t('onboard.seller_info.phone')}
            type={"tel"} circle={true} required={true} num={true}
            placeholder={t('onboard.seller_info.phone_placeholder')}
            name="personal_phone"
            value={formik.values.personal_phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.personal_phone}
            touched={formik.touched.personal_phone}
          />
        </div>

        <SellerInfoSellect
          arr={countriesArr}
          title={t('onboard.seller_info.nationality')}
          titleSellect={t('onboard.seller_info.select_nationality')}
          value={formik.values.nationality}
          setValue={(v) => formik.setFieldValue("nationality", v)}
          errText={t('onboard.seller_info.nationality_required')}
        />

        <IdentDocumInp scopeProp={"self_employed_personal"} selfData={selfData} ref={ignoreBlurRef} formik={formik} />

        {/* <div>
          <UploadInp
            title={t('onboard.seller_info.identity_doc')}
            description={t('onboard.seller_info.passport_id')}
            scope={"self_employed_personal"}
            docType={"identity_document"}
            side={"front"}
            onChange={handleSingleFrontUpload}
            inpText={t('onboard.seller_info.upload_front')}
            stateName={selfData?.front}
            nameTitle={"front"}
            onMouseDown={() => (ignoreBlurRef.current = true)}
          />

          <UploadInp
            scope={"self_employed_personal"}
            docType={"identity_document"}
            side={"back"}
            onChange={handleSingleFrontUpload}
            inpText={t('onboard.seller_info.upload_back')}
            stateName={selfData?.back}
            nameTitle={"back"}
            onMouseDown={() => (ignoreBlurRef.current = true)}
          />

          {(formik.touched.uploadFront || formik.touched.uploadBack) &&
            (formik.errors.uploadFront || formik.errors.uploadBack) && (
              <p className={styles.errorText}>
                {formik.errors.uploadFront || formik.errors.uploadBack}
              </p>
            )}
        </div> */}
      </div>
    </div>
  )
}

export default PersonalDetails