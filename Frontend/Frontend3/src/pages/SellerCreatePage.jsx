import { useTranslation } from "react-i18next";
import SellerCreateForm from "../Components/Seller/create/sellerCreateForm/SellerCreateForm";

import styles from "../styles/SellerCreatePage.module.scss";

const SellerCreatePage = () => {

  const { t } = useTranslation('sellerHome')


  return (
    <div style={{ paddingBottom: "100px" }}>
      <h3 className={styles.createTitle}>{t('goods.creation')}</h3>
      <SellerCreateForm />
    </div>
  );
};

export default SellerCreatePage;
