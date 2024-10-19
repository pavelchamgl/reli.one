import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useActions } from "../hook/useAction";
import { useTranslation } from "react-i18next";

import Container from "../ui/Container/Container";
import CategoryCard from "../Components/Category/CategoryCard/CategoryCard";
import ProductCard from "../Components/Product/ProductCard/ProductCard";

import styles from "../styles/MainPage.module.scss";
import CustomBreadcrumbs from "../ui/CustomBreadCrumps/CustomBreadCrumps";
import NoContentText from "../ui/NoContentText/NoContentText";

const MainPage = () => {
  const productsData = useSelector((state) => state.products.products || []);
  const allCategory = useSelector(
    (state) => state.category.allCategories || []
  );

  const { fetchGetCategory, fetchGetProducts } = useActions();
  const { t } = useTranslation();

  useEffect(() => {
    console.log(allCategory);
  }, [allCategory]);

  useEffect(() => {
    const existingValue = localStorage.getItem("basket");
    if (!existingValue) {
      localStorage.setItem("basket", JSON.stringify([]));
    } else {
      localStorage.setItem("basket", existingValue);
    }
  }, []);

  useEffect(() => {
    console.log(productsData);
  }, [productsData]);

  useEffect(() => {
    fetchGetCategory();
    fetchGetProducts();
  }, []);

  return (
    <Container>
      <div className={styles.breadHide}>
        <CustomBreadcrumbs />
      </div>
      <div className={styles.categoryWrap}>
        <div className={styles.categoryCardWrap}>
          {allCategory.length > 0 ? (
            allCategory
              ?.slice(0, 18)?.reverse()
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
  );
};

export default MainPage;
