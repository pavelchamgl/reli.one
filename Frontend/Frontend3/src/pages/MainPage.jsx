import Container from "../ui/Container/Container";

import styles from "../styles/MainPage.module.scss";
import CategoryCard from "../Components/Category/CategoryCard/CategoryCard";
import ProductCard from "../Components/Product/ProductCard/ProductCard";

const MainPage = () => {
  return (
    <Container>
      <div className={styles.categoryWrap}>
        <p className={styles.title}>Kategorie</p>
        <div className={styles.categoryCardWrap}>
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
        </div>
      </div>

      <div className={styles.productCardWrapMain}>
        <p className={styles.title}>Doporučujeme pro vás</p>
        <div className={styles.productCardWrap}>
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
        </div>
      </div>
    </Container>
  );
};

export default MainPage;
