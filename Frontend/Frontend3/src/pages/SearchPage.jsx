import { useState } from "react";
import { Pagination } from "@mui/material";

import xIcon from "../assets/Search/x.svg";
import Container from "../ui/Container/Container";
import ProductCard from "../Components/Product/ProductCard/ProductCard";

import styles from "../styles/SearchPage.module.scss";

const SearchPage = () => {
  const [page, setPage] = useState(1);

  const handleChange = (event, value) => {
    console.log(value);
    setPage(value);
  };

  return (
    <Container>
      <div className={styles.main}>
        <h3 className={styles.title}>Sluchátka</h3>
        <div className={styles.categoryDiv}>
          <img src={xIcon} alt="" />
          <p>Kategorie: Příslušenství</p>
        </div>
        <div className={styles.productDiv}>
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
        </div>
        <div className={styles.paginateDiv}>
          <Pagination
            shape="rounded"
            count={10}
            page={page}
            onChange={handleChange}
          />
        </div>
      </div>
    </Container>
  );
};

export default SearchPage;
