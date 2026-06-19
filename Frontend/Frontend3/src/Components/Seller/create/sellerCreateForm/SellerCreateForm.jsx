  import { useFormik } from "formik";
  import { useNavigate } from "react-router-dom";
  import { useEffect, useMemo, useState } from "react";
  import { useSelector } from "react-redux";
  import { useTranslation } from "react-i18next";

  import { useActionCreatePrev } from "../../../../hook/useActionCreatePrev";
  import { getValidateGoods } from "../../../../code/validation/validationGoods";
  import CreateFormInp from "../../../../ui/Seller/create/createFormInp/CreateFormInp";
  import CreateCharacInp from "../../../../ui/Seller/create/createCharacteristicsInp/CreateCharacInp";
  import SellerCreateImage from "../sellerCreateImages/SellerCreateImage";
  import SellerCreateVariants from "../sellerCreateVariants/SellerCreateVariants";
  import CreateCategoryMain from "../../../../ui/Seller/create/createCategory/createCategoryMain/CreateCategoryMain";
  import CreateLisence from "../createLisence/CreateLisence"
  import SellerCategoryAttributesFields from "../../shared/SellerCategoryAttributesFields";
  import { getVisibleProductParameters } from "../../shared/sellerProductParameters";
import {
    getCategorySchemaNotReadyMessage,
    isCategoryAttributeSchemaReady,
    isProductVariantsValid,
  validateAttributeDraft,
  validateProductVariants,
  getBrandNameFieldError,
} from "../../../../utils/sellerProductWizard";

  import styles from "./SellerCreateForm.module.scss";
  import CheckBox from "../../../../ui/CheckBox/CheckBox";

  const FormSection = ({ title, children }) => (
    <section className={styles.formSection}>
      {title ? <h3 className={styles.sectionTitle}>{title}</h3> : null}
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );

  const
    SellerCreateForm = () => {
      const navigate = useNavigate();

      const {
        name,
        brand_name,
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
        country_of_origin,
        warranty_months,
        vat_rate,
        is_age,
        attributeSchema,
        attributeValues,
        attributeErrors,
        attributeSchemaStatus,
        fieldErrors,
      } = useSelector(state => state.create_prev)

      const [files, setFiles] = useState([])
      const [parameters, setParameters] = useState(() => (
        Array.isArray(product_parameters) ? [...product_parameters] : []
      ))
      const [variants, setVariants] = useState([])
      const [imageErr, setImageErr] = useState(false)
      const [categoryErr, setCategoryErr] = useState(false)
      const [parametersErr, setParametersErr] = useState(false)
      const [varNameErr, setVarNameErr] = useState(false)
      const [varErr, setVarErr] = useState(false)
      const [variantValidation, setVariantValidation] = useState({ name: null, section: null, variants: {} })

      const {
        setName,
        setBrandName,
        setDescription,
        setCategory,
        setParametersPrev,
        setValues,
        fetchCreateCategoryAttributeSchema,
        setAttributeValue,
        setAttributeErrors
      } = useActionCreatePrev()

      const { categoriesStage } = useSelector(state => state.create)
      const authToken = useSelector(state => state.auth.token)

      const { t } = useTranslation('sellerHome')

      const validationSchema = useMemo(() => getValidateGoods(t), [t]);
      const brandApiError = useMemo(() => getBrandNameFieldError(fieldErrors, t), [fieldErrors, t]);

      const formik = useFormik({
        initialValues: {
          name: name ? name : "",
          brand_name: brand_name ? brand_name : "",
          product_description: product_description ? product_description : "",
          length: lengthMain ? lengthMain : "",
          width: widthMain ? widthMain : "",
          height: heightMain ? heightMain : "",
          weight: weightMain ? weightMain : "",
          item: item,
          barcode: barcode,
          additional_details: additional_details,
          country_of_origin: country_of_origin,
          warranty_months: warranty_months,
          vat_rate: vat_rate,
          is_age: is_age
        },
        validationSchema,
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
        if (category?.id && authToken?.access) {
          fetchCreateCategoryAttributeSchema(category.id)
        }
      }, [category?.id, authToken?.access])


      useEffect(() => {
        setParametersPrev([...parameters])

      }, [parameters]);

      const handlePreviewClick = () => {
        const isImagesValid = images.length > 0;
        const isCategoryValid = Boolean(category);
        const visibleParameters = getVisibleProductParameters(product_parameters);
        const isParametersValid =
          !visibleParameters.length ||
          visibleParameters.every(
            (item) => item.name?.trim() && item.value?.trim()
          );
        const isSchemaReady = isCategoryAttributeSchemaReady(category, attributeSchema, attributeSchemaStatus)
        const nextAttributeErrors = validateAttributeDraft(attributeSchema?.attributes || [], attributeValues || {}, t)
        if (isCategoryValid && !isSchemaReady) {
          nextAttributeErrors.schema = getCategorySchemaNotReadyMessage(t)
        }
        const areAttributesValid = Object.keys(nextAttributeErrors).length === 0
        const nextVariantValidation = validateProductVariants(
          { variantsName, variants: variantsMain },
          t
        );
        const isVariantValid = isProductVariantsValid(nextVariantValidation);

        setCategoryErr(!isCategoryValid);
        setImageErr(!isImagesValid);
        setParametersErr(!isParametersValid)
        setVarNameErr(Boolean(nextVariantValidation.name));
        setVarErr(!isVariantValid);
        setVariantValidation(nextVariantValidation);
        setAttributeErrors(nextAttributeErrors)

        if (isImagesValid && isCategoryValid && isParametersValid && isVariantValid && areAttributesValid) {
          formik.handleSubmit();
        }
      };





      return (
        <div className={styles.main}>
          <FormSection>
            <CreateCategoryMain err={categoryErr} setErr={setCategoryErr} />

            <CreateFormInp text={t('goods.brand')} name="brand_name" value={formik.values.brand_name} {...formik} handleChange={(e) => {
              setBrandName({ brand_name: e.target.value })
              formik.handleChange(e)
            }} titleSize={"big"} required={false} error={formik.errors.brand_name || brandApiError} placeholder={t('goods.placeholders.brand')} />

            <CreateFormInp text={t('goods.name')} name="name" value={formik.values.name} {...formik} handleChange={(e) => {
              setName({ name: e.target.value })
              formik.handleChange(e)
            }} titleSize={"big"} required={true} error={formik.errors.name} placeholder={t('goods.placeholders.productName')} />
          </FormSection>

          <FormSection>
            <SellerCreateImage setErr={setImageErr} err={imageErr} setFilesMain={setFiles} />
          </FormSection>

          <FormSection>
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
              placeholder={t('goods.placeholders.productDescription')}
            />
          </FormSection>

          <FormSection title={t('goods.categoryAttributesTitle')}>
            <SellerCategoryAttributesFields
              schema={attributeSchema?.attributes || []}
              values={attributeValues}
              errors={attributeErrors}
              loading={attributeSchemaStatus === "pending"}
              onChange={(attributeId, value) => setAttributeValue({ attributeId, value })}
            />
            <CreateCharacInp err={parametersErr} setErr={setParametersErr} setParameters={setParameters} />
          </FormSection>

          <FormSection title={t('goods.variantsSectionTitle')}>
            <CreateFormInp
              name='vat_rate'
              value={formik.values.vat_rate}
              text={t('goods.vatRate')}
              titleSize={"small"}
              {...formik}
              handleChange={formik.handleChange}
              error={formik.errors.vat_rate}
              num={true}
              decimal={true}
              placeholder={t('goods.placeholders.vatRate')}
            />
            <SellerCreateVariants
              err={varErr}
              setErr={setVarErr}
              errName={varNameErr}
              setErrName={setVarNameErr}
              variantValidation={variantValidation}
              setMainVariants={setVariants}
            />
          </FormSection>

          <FormSection title={t('goods.documentsSectionTitle')}>
            <CreateLisence />
          </FormSection>

          <details className={styles.additionalDetails}>
            <summary>{t('goods.additionalSellerDetailsTitle')}</summary>
            <div className={styles.additionalDetailsBody}>
              <CreateFormInp
                name="additional_details"
                value={formik.values.additional_details}
                {...formik}
                handleChange={formik.handleChange}
                text={t('goods.additionalDetailsLabel')}
                titleSize={"small"}
                textarea={true}
                placeholder={t('goods.placeholders.additionalDetails')}
              />
              <CreateFormInp
                name="country_of_origin"
                value={formik.values.country_of_origin}
                text={t('goods.countryOfOriginLabel')}
                titleSize={"small"}
                {...formik}
                handleChange={formik.handleChange}
                placeholder={t('goods.placeholders.countryOfOrigin')}
              />
              <CreateFormInp
                name="warranty_months"
                value={formik.values.warranty_months}
                text={t('goods.warrantyMonthsLabel')}
                titleSize={"small"}
                {...formik}
                handleChange={formik.handleChange}
                error={formik.errors.warranty_months}
                num={true}
                digitsOnly={true}
                placeholder={t('goods.placeholders.warrantyMonths')}
              />
              <CreateFormInp
                name='barcode'
                value={formik.values.barcode}
                text={t('goods.barcodeLabel')}
                titleSize={"small"}
                {...formik}
                handleChange={formik.handleChange}
                digitsOnly={true}
                placeholder={t('goods.placeholders.barcode')}
              />
              <CreateFormInp
                name='item'
                value={formik.values.item}
                text={t('goods.sellerArticleLabel')}
                titleSize={"small"}
                {...formik}
                handleChange={formik.handleChange}
                error={formik.errors.item}
                num={true}
                digitsOnly={true}
                placeholder={t('goods.placeholders.sellerArticle')}
              />
              <label className={styles.isAgeLabel}>
                <CheckBox
                  check={is_age}
                  onChange={(v) => {
                    setValues({ is_age: v })
                    formik.setFieldValue("is_age", v)
                  }}
                  style={{ borderRadius: "4px" }}
                />
                {t('goods.ageRestrictedLabel')}
              </label>
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
