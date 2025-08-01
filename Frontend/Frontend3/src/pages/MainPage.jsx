import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useActions } from "../hook/useAction";
import { useTranslation } from "react-i18next";

import Container from "../ui/Container/Container";
import CategoryCard from "../Components/Category/CategoryCard/CategoryCard";
import ProductCard from "../Components/Product/ProductCard/ProductCard";

import styles from "../styles/MainPage.module.scss";
import CustomBreadcrumbs from "../ui/CustomBreadCrumps/CustomBreadCrumps";
import NoContentText from "../ui/NoContentText/NoContentText";
import BannerSlider from "../Components/BannerSlider/BannerSlider";

const MainPage = () => {
  const productsData = useSelector((state) => state.products.products || []);
  const mainCategories = useSelector(
    (state) => state.category.mainCategories || []
  );


  const { fetchGetCategory, fetchGetProducts } = useActions();
  const { t } = useTranslation();

  useEffect(() => {
    fetchGetCategory();
    fetchGetProducts();
  }, []);




  return (
    <>
      {/* <BannerSlider />  */}
      <Container>
        <div className={styles.breadHide}>
          <CustomBreadcrumbs />
        </div>
        <div className={styles.categoryWrap}>
          <div className={styles.categoryCardWrap}>
            {mainCategories.length > 0 ? (
              mainCategories
                ?.slice(0,  20)
                .map((item) => <CategoryCard key={item.id} item={item} />)
            ) : (
              <NoContentText />
            )}
          </div>
        </div>

        <div className={styles.productCardWrapMain}>
          <p className={styles.title}>{t("recommend")}</p>
          <div className={styles.productCardWrap}>
            {productsData.length > 0 ? (
              productsData.map((item) => (
                <ProductCard data={item} key={item.id} />
              ))
            ) : (
              <NoContentText />
            )}
          </div>
        </div>
      </Container>
    </>
  );
};

export default MainPage;
