import { useMediaQuery } from "react-responsive";

import Container from "../ui/Container/Container";

import styles from "../styles/LikedPage.module.scss";
import ProductCard from "../Components/Product/ProductCard/ProductCard";
import FilterByPopularity from "../ui/FilterByPopularity/FilterByPopularity";
import NoContentText from "../ui/NoContentText/NoContentText";
import FilterByPrice from "../ui/FilterByPrice/FilterByPrice";

const LikedPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 425 });

  return (
    <>
      <div className={styles.titleDiv}>
        <p className={styles.title}>Výbor</p>
      </div>

      <Container>
        <div className={styles.filterDiv}>
          {!isMobile && <FilterByPopularity />}
          {/* <FilterByPrice /> */}
        </div>
        <div className={styles.likedProdWrap}>
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          {/* <NoContentText /> */}
        </div>
      </Container>
    </>
  );
};

export default LikedPage;
