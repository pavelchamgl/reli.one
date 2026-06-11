  import { useFormik } from "formik";
  import { useNavigate } from "react-router-dom";
  import { useEffect, useState } from "react";
  import { useSelector } from "react-redux";
  import { useTranslation } from "react-i18next";

  import { useActionCreatePrev } from "../../../../hook/useActionCreatePrev";
  import { validateGoods } from "../../../../code/validation/validationGoods";
  import CreateFormInp from "../../../../ui/Seller/create/createFormInp/CreateFormInp";
  import CreateCharacInp from "../../../../ui/Seller/create/createCharacteristicsInp/CreateCharacInp";
  import SellerCreateImage from "../sellerCreateImages/SellerCreateImage";
  import SellerCreateVariants from "../sellerCreateVariants/SellerCreateVariants";
  import CreateCategoryMain from "../../../../ui/Seller/create/createCategory/createCategoryMain/CreateCategoryMain";
  import CreateLisence from "../createLisence/CreateLisence"
  import SellerCategoryAttributesFields from "../../shared/SellerCategoryAttributesFields";
  import {
    CATEGORY_SCHEMA_NOT_READY_MESSAGE,
    isCategoryAttributeSchemaReady,
    validateAttributeDraft
  } from "../../../../utils/sellerProductWizard";

  import styles from "./SellerCreateForm.module.scss";
  import CheckBox from "../../../../ui/CheckBox/CheckBox";

  const FormSection = ({ title, children }) => (
    <section className={styles.formSection}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );

  const FutureField = ({ label }) => (
    <CreateFormInp
      name={label}
      value=""
      text={label}
      titleSize="small"
      handleChange={() => {}}
      disabled
    />
  );

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


      const {
        name,
        lengthMain,
        product_description,
        widthMain,
        heightMain,
        weightMain,
        category,
        variantsName,
        variantsMain,
        images,
        product_parameters,
        item,
        barcode,
        additional_details,
        vat_rate,
        is_age,
        type,
        attributeSchema,
        attributeValues,
        attributeErrors,
        attributeSchemaStatus
      } = useSelector(state => state.create_prev)

      const {
        setName,
        setDescription,
        setCategory,
        setParametersPrev,
        setValues,
        setType,
        fetchCreateCategoryAttributeSchema,
        setAttributeValue,
        setAttributeErrors
      } = useActionCreatePrev()

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
        const selectedCategory = categoriesStage?.[categoriesStage.length - 1]
        if (selectedCategory) {
          setCategory(selectedCategory)
        }
      }, [categoriesStage])

      useEffect(() => {
        if (category?.id) {
          fetchCreateCategoryAttributeSchema(category.id)
        }
      }, [category?.id])


      useEffect(() => {
        setParametersPrev([...parameters])

      }, [parameters]);

      const isVariantDimensionsValid = (item) => {
        return ["weight", "width", "height", "length"].every((field) => {
          const value = Number(item[field])
          return Number.isFinite(value) && value > 0
        })
      }

      const isVariantStockValid = (item) => {
        if (item.quantity_in_stock === undefined || item.quantity_in_stock === "") {
          return true
        }
        const value = Number(item.quantity_in_stock)
        return Number.isInteger(value) && value >= 0
      }

      const handlePreviewClick = () => {
        const isImagesValid = images.length > 0;
        const isCategoryValid = Boolean(category);
        const isParametersValid =
          !product_parameters?.length ||
          product_parameters.every(
            (item) => item.name?.trim() && item.value?.trim()
          );
        const isVarNameErrValid = variantsName.length > 0
        const isSchemaReady = isCategoryAttributeSchemaReady(category, attributeSchema, attributeSchemaStatus)
        const nextAttributeErrors = validateAttributeDraft(attributeSchema?.attributes || [], attributeValues || {})
        if (isCategoryValid && !isSchemaReady) {
          nextAttributeErrors.schema = CATEGORY_SCHEMA_NOT_READY_MESSAGE
        }
        const areAttributesValid = Object.keys(nextAttributeErrors).length === 0
        let isVariantValid;

        if (type === "text") {
          isVariantValid =
            variantsMain?.length > 0 &&
            variantsMain.every(
              (item) =>
                item.price?.trim() &&
                !isNaN(Number(item.price)) &&
                item.text?.trim() &&
                isVariantDimensionsValid(item) &&
                isVariantStockValid(item)
            );
        } else {
          isVariantValid =
            variantsMain?.length > 0 &&
            variantsMain.every(
              (item) =>
                item.price?.trim() &&
                !isNaN(Number(item.price)) &&
                item.image?.trim() &&
                isVariantDimensionsValid(item) &&
                isVariantStockValid(item)
            );
        }

        setCategoryErr(!isCategoryValid);
        setImageErr(!isImagesValid);
        setParametersErr(!isParametersValid)
        setVarNameErr(!isVarNameErrValid)
        setVarErr(!isVariantValid)
        setAttributeErrors(nextAttributeErrors)

        if (isImagesValid && isCategoryValid && isParametersValid && isVariantValid && areAttributesValid) {
          formik.handleSubmit();
        }
      };





      return (
        <div className={styles.main}>
          <FormSection title="Main information">
            <CreateFormInp text={t('goods.name')} name="name" value={formik.values.name} {...formik} handleChange={(e) => {
              setName({ name: e.target.value })
              formik.handleChange(e)
            }} titleSize={"big"} required={true} error={formik.errors.name} />

            <CreateCategoryMain err={categoryErr} setErr={setCategoryErr} />
            <FutureField label="Brand" />

            <CreateFormInp
              name='item'
              value={formik.values.item}
              text="Seller article"
              titleSize={"small"}
              {...formik}
              handleChange={formik.handleChange}
              error={formik.errors.item}
              num={true}
            />

            <CreateFormInp
              name='barcode'
              value={formik.values.barcode}
              text="EAN/UPC barcode"
              titleSize={"small"}
              {...formik}
              handleChange={formik.handleChange}
            />

            <label className={styles.isAgeLabel}>
              <CheckBox check={is_age} onChange={(v) => setValues({ is_age: v })} style={{ borderRadius: "4px" }} />
              Age restricted
            </label>

            <CreateFormInp
              name='vat_rate'
              value={formik.values.vat_rate}
              text={'VAT rate'}
              titleSize={"small"}
              {...formik}
              handleChange={formik.handleChange}
              required={true}
              error={formik.errors.vat_rate}
              num={true}
            />
          </FormSection>

          <FormSection title="Media files">
            <SellerCreateImage setErr={setImageErr} err={imageErr} setFilesMain={setFiles} />
          </FormSection>

          <FormSection title="Description">
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

            <CreateFormInp
              name="additional_details"
              value={formik.values.additional_details}
              {...formik}
              handleChange={formik.handleChange}
              text={"Additional details"}
              titleSize={"small"}
              textarea={true}
            />
          </FormSection>

          <FormSection title="Category attributes">
            <SellerCategoryAttributesFields
              schema={attributeSchema?.attributes || []}
              values={attributeValues}
              errors={attributeErrors}
              loading={attributeSchemaStatus === "pending"}
              onChange={(attributeId, value) => setAttributeValue({ attributeId, value })}
            />
            <CreateCharacInp err={parametersErr} setErr={setParametersErr} setParameters={setParameters} />
          </FormSection>

          <FormSection title="Variants, price and stock">
            <SellerCreateVariants err={varErr} setErr={setVarErr} type={type} setType={setType} errName={varNameErr} setErrName={setVarNameErr} setMainVariants={setVariants} />
          </FormSection>

          <FormSection title="Documents">
            <CreateLisence />
          </FormSection>

          <details className={styles.additionalDetails}>
            <summary>Additional seller details</summary>
            <div className={styles.futureFieldsGrid}>
              <FutureField label="Country of origin" />
              <FutureField label="Warranty" />
              <FutureField label="HS code" />
              <FutureField label="Packaging material" />
              <FutureField label="Seller note" />
            </div>
          </details>

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
