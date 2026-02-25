import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import AccountInfo from "../../Components/Seller/auth/review/accountInfo/AccountInfo"
import FormWrap from "../../ui/Seller/auth/formWrap/FormWrap"
import TitleAndDesc from "../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from "../../ui/Seller/register/stepWrap/StepWrap"
import PersonalDetails from "../../Components/Seller/auth/review/personalDetails/PersonalDetails"
import BusinessAddress from "../../Components/Seller/auth/review/businessAddress/BusinessAddress"
import BankAccount from "../../Components/Seller/auth/review/bankAccount/BankAccount"
import WarehouseAndReturn from "../../Components/Seller/auth/review/WarehouseAndReturn/WarehouseAndReturn"
import SubBtn from "../../ui/Seller/review/subBtn/SubBtn"
import { getReviewOnboarding, postSubmitOnboarding, putOnboardingBank, putPersonalData, putReturnAddress, putSelfAddress, putTax, putWarehouse } from "../../api/seller/onboarding"
import { ErrToast } from "../../ui/Toastify"

import PersonalEdit from "../../Components/Seller/auth/sellerInfo/PersonalDetails/PersonalDetails"


import styles from "./ReviewInfoPage.module.scss"
import { useFormik } from "formik"
import { validationSchemaSelf } from "../../code/seller/validation"
import TaxInfo from "../../Components/Seller/auth/sellerInfo/TaxInfo/TaxInfo"
import AddressBlock from "../../Components/Seller/auth/sellerInfo/address/AddressBlock"
import BankAccountEdit from "../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount"
import WhareHouseAddress from "../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress"
import ReturnAddress from "../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress"
import { toISODate } from "../../code/seller"

const ReviewInfoPage = () => {

  const { selfData, registerData } = useSelector(state => state.selfEmploed)


  const formik = useFormik({
    initialValues: {

      // personal
      first_name: registerData?.first_name ?? "",
      last_name: registerData?.last_name ?? "",
      date_of_birth: selfData?.date_of_birth ?? "",
      nationality: selfData?.nationality ?? "",
      personal_phone: registerData?.phone ?? "",
      uploadFront: selfData?.uploadFront ?? "",
      uploadBack: selfData?.uploadBack ?? "",

      // tax
      tax_country: selfData?.tax_country ?? "",
      tin: selfData?.tin ?? "",
      ico: selfData?.ico ?? "",
      vat_id: selfData?.vat_id ?? "",

      // address
      street: selfData?.street ?? "",
      city: selfData?.city ?? "",
      zip_code: selfData?.zip_code ?? "",
      country: selfData?.country ?? "",
      proof_document_issue_date: selfData.proof_document_issue_date ?? "",

      // bank
      iban: selfData?.iban ?? "",
      swift_bic: selfData?.swift_bic ?? "",
      account_holder: selfData?.account_holder ?? "",
      bank_code: selfData?.bank_code ?? "",
      local_account_number: selfData?.local_account_number ?? "",

      // warehouse
      wStreet: selfData?.wStreet ?? "",
      wCity: selfData?.wCity ?? "",
      wZip_code: selfData?.wZip_code ?? "",
      wCountry: selfData?.wCountry ?? "",
      contact_phone: selfData?.contact_phone ?? "",
      wProof_document_issue_date: selfData?.wProof_document_issue_date ?? "",

      // return
      rStreet: selfData?.rStreet ?? "",
      rCity: selfData?.rCity ?? "",
      rZip_code: selfData?.rZip_code ?? "",
      rCountry: selfData?.rCountry ?? "",
      rContact_phone: selfData?.rContact_phone ?? "",
      rProof_document_issue_date: selfData?.rProof_document_issue_date ?? ""
    },
    validationSchema: validationSchemaSelf,
    // enableReinitialize: true,
    validateOnChange: true,
    // validateOnMount: false,
    // validateOnChange: false,
    // validateOnBlur: true,
    onSubmit: async (values) => {
      safeData(values);

      // массив промисов с описанием

    }
  })

  const [openAccount, setOpenAccount] = useState(false)
  const [openTax, setOpenTax] = useState(false)
  const [openAddress, setOpenAddress] = useState(false)
  const [openBank, setOpenBank] = useState(false)
  const [openWarehouse, setOpenWarehouse] = useState(false)


  const navigate = useNavigate()

  useEffect(() => {
    getReviewOnboarding()
  }, [])

 const parseApiErrors = (data) => {
  if (!data) return ["Unknown error"];

  // 🔹 Если строка
  if (typeof data === "string") return [data];

  // 🔹 Стандартные backend поля
  if (data.detail) return [String(data.detail)];
  if (data.message) return [String(data.message)];

  // 🔹 Человекочитаемые названия для completeness
  const labels = {
    seller_type_selected: "Seller type",
    personal_complete: "Personal details",
    tax_complete: "Tax info",
    address_complete: "Address",
    bank_complete: "Bank account",
    warehouse_complete: "Warehouse",
    return_complete: "Return address",
    documents_complete: "Documents",
  };

  // 🔹 Обработка completeness
  const completeness = data.completeness ?? data;

  if (completeness && typeof completeness === "object") {
    const failed = Object.entries(completeness)
      .filter(
        ([_, value]) =>
          typeof value === "string" &&
          value.toLowerCase() === "false"
      )
      .map(([key]) => labels[key] ?? key);

    if (failed.length) {
      return ["Please complete: " + failed.join(", ")];
    }
  }

  // 🔹 Универсальный проход по вложенным объектам
  const messages = [];

  const walk = (obj) => {
    if (!obj) return;

    if (typeof obj === "string") {
      messages.push(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(walk);
    } else if (typeof obj === "object") {
      Object.values(obj).forEach(walk);
    }
  };

  walk(data);

  return messages.length ? messages : ["Unexpected error"];
};

  const handleSubmit = async () => {
    const values = formik.values;

    try {
      const requests = [
        {
          name: "Personal Data",
          promise: putPersonalData({
            date_of_birth: values.date_of_birth
              ?.split(".")
              .reverse()
              .join("-"),
            nationality: selfData.nationality,
            personal_phone: values.personal_phone,
          }),
        },
        {
          name: "Tax Info",
          promise: putTax({
            tax_country: selfData.tax_country,
            tin: values.tin,
            ico:
              selfData.tax_country === "cz" ||
                selfData.tax_country === "sk"
                ? ""
                : values.ico,
            vat_id: values.vat_id,
          }),
        },
        {
          name: "Self Address",
          promise: putSelfAddress({
            street: values.street,
            city: values.city,
            zip_code: values.zip_code,
            country: selfData.country,
            proof_document_issue_date: toISODate(values.proof_document_issue_date),
          }),
        },
        {
          name: "Bank Account",
          promise: putOnboardingBank({
            iban: values.iban,
            swift_bic: values.swift_bic,
            account_holder: values.account_holder,
            bank_code: values.bank_code,
            local_account_number: values.local_account_number,
          }),
        },
        {
          name: "Warehouse",
          promise: putWarehouse({
            street: values.wStreet,
            city: values.wCity,
            zip_code: values.wZip_code,
            country: selfData.wCountry,
            contact_phone: values.contact_phone,
            proof_document_issue_date: toISODate(
              values.wProof_document_issue_date
            ),
          }),
        },
        {
          name: "Return Address",
          promise: putReturnAddress({
            same_as_warehouse: selfData.same_as_warehouse,
            street: values.rStreet,
            city: values.rCity,
            zip_code: values.rZip_code,
            country: selfData.rCountry,
            contact_phone: values.rContact_phone,
            proof_document_issue_date: toISODate(
              values.wProof_document_issue_date
            ),
          }),
        },
      ];

      const results = await Promise.allSettled(
        requests.map((r) => r.promise)
      );

      // 🔥 Правильный сбор ошибок
      const errors = results
        .map((result, index) => {
          if (result.status === "rejected") {
            const data = result.reason?.response?.data;
            const messages = parseApiErrors(data);
            return `${requests[index].name}: ${messages.join(", ")}`;
          }
          return null;
        })
        .filter(Boolean);

      if (errors.length) {
        ErrToast(errors.join("\n"));
        return;
      }

      // 🔥 Теперь отправляем submit
      const submitRes = await postSubmitOnboarding();

      console.log(submitRes);


      if (submitRes.status >= 200 && submitRes.status < 300) {
        navigate("/seller/application-sub");
      } else {
        ErrToast("Failed to submit onboarding");
      }

    } catch (error) {
      console.log(error);

      const responseData = error?.response?.data;
      const messages = parseApiErrors(responseData);
      messages.forEach((msg) => ErrToast(msg));
      // navigate('/seller/seller-info')
    }
  };


  return (
    <FormWrap style={{ height: "100%" }}>
      <div className={styles.main}>
        <div className={styles.titleWrap}>
          <TitleAndDesc title={"Review Your Information"}
            desc={"Please review all information before submitting your application"} />

          <StepWrap step={5} />

        </div>

        {
          openAccount ?
            <PersonalEdit onClosePreview={() => setOpenAccount(false)} formik={formik} />
            :
            <AccountInfo setOpen={setOpenAccount} data={selfData} />
        }

        {
          openTax ?
            <TaxInfo formik={formik} onClosePreview={() => setOpenTax(false)} />
            :
            <PersonalDetails setOpen={setOpenTax} data={selfData} />
        }

        {
          openAddress ?
            <AddressBlock onClosePreview={() => setOpenAddress(false)} formik={formik} />
            :
            <BusinessAddress setOpen={setOpenAddress} data={selfData} />

        }

        {
          openBank ?
            <BankAccountEdit onClosePreview={() => setOpenBank(false)} formik={formik} />
            :
            <BankAccount setOpen={setOpenBank} data={selfData} />
        }

        {
          openWarehouse ?
            <>
              <WhareHouseAddress formik={formik} />
              <ReturnAddress formik={formik} />
            </>
            :
            <WarehouseAndReturn setOpen={setOpenWarehouse} data={selfData} />

        }








        <SubBtn onClick={handleSubmit} />

      </div>

    </FormWrap>
  )
}

export default ReviewInfoPage