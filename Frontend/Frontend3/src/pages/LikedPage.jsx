import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useEffect } from "react";
import { useActions } from "../hook/useAction";

import { Pagination } from "@mui/material";
import Container from "../ui/Container/Container";
import Loader from "../ui/Loader/Loader";
import ProductCard from "../Components/Product/ProductCard/ProductCard";
import FilterByPopularity from "../ui/FilterByPopularity/FilterByPopularity";
import NoContentText from "../ui/NoContentText/NoContentText";
import FilterByPrice from "../ui/FilterByPrice/FilterByPrice";
import MobFilter from "../Components/MobFilter/MobFilter";

import styles from "../styles/LikedPage.module.scss";

const LikedPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 426 });

  const [orderingState, setOrderingState] = useState("rating");
  const [page, setPage] = useState(1);
  const [productsData, setProductsData] = useState([]);

  const { fetchFavoriteProducts, setOrderingFav, setPageFav } = useActions();

  useEffect(() => {
    fetchFavoriteProducts();
  }, []);

  useEffect(() => {
    fetchFavoriteProducts();
  }, [orderingState, page]);

  const { products, status, count } = useSelector((state) => state.favorites);

  useEffect(() => {
    setProductsData(products);
  }, [products]);

  const handleChange = (event, value) => {
    setPage(value);
    setPageFav(value);
  };

  return (
    <>
      <div className={styles.titleDiv}>
        <p className={styles.title}>Favorites</p>
      </div>

      <Container>
        {/* {isMobile && (
          <MobFilter
            setOrdering={setOrderingFav}
            setOrderingState={setOrderingState}
          />
        )} */}
        <div className={styles.filterDiv}>
          {!isMobile && (
            <div style={{ display: "flex", gap: "10px" }}>
              <FilterByPopularity
                section={"liked"}
                setOrderingState={setOrderingState}
                setOrdering={setOrderingFav}
              />
            </div>
          )}
          {/* <FilterByPrice /> */}
        </div>
        <div className={styles.likedProdWrap}>
          {productsData && productsData.length > 0 ? (
            productsData.map((item) => (
              <ProductCard key={item.id} data={item} />
            ))
          ) : (
            <NoContentText />
          )}
        </div>
        <div className={styles.paginateDiv}>
          <Pagination
            shape="rounded"
            count={Math.ceil(count / 35)} // Использование Math.ceil для округления вверх
            page={page}
            onChange={handleChange}
          />
        </div>
      </Container>
    </>
  );
};

export default LikedPage;
