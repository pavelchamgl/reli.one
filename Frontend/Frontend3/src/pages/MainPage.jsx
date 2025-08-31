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
import { useMediaQuery } from "react-responsive";

const MainPage = () => {
  const productsData = useSelector((state) => state.products.products || []);
  const mainCategories = useSelector(
    (state) => state.category.mainCategories || []
  );

  const isMobile = useMediaQuery({ maxWidth: 500 })

  const [categories, setCategories] = useState([])


  const { fetchGetCategory, fetchGetProducts } = useActions();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchGetCategory();
    fetchGetProducts();
  }, [i18n.language]);

  useEffect(() => {
    if (isMobile) {
      setCategories(mainCategories?.slice(0, 18))
    } else {
      setCategories(mainCategories?.slice(0, 20))
    }
  }, [mainCategories, isMobile])






  return (
    <>
      <BannerSlider /> 
      <Container>
        <div className={styles.breadHide}>
          <CustomBreadcrumbs />
        </div>
        <div className={styles.categoryWrap}>
          <div className={styles.categoryCardWrap}>
            {categories.length > 0 ? (
              categories
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
