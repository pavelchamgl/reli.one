import { useEffect, useState } from "react";
import { Pagination } from "@mui/material";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useActions } from "../hook/useAction";

import xIcon from "../assets/Search/x.svg";
import Container from "../ui/Container/Container";
import ProductCard from "../Components/Product/ProductCard/ProductCard";
import FilterByPopularity from "../ui/FilterByPopularity/FilterByPopularity";
import FilterByPrice from "../ui/FilterByPrice/FilterByPrice";
import MobFilter from "../Components/MobFilter/MobFilter";

import styles from "../styles/SearchPage.module.scss";
import NoContentText from "../ui/NoContentText/NoContentText";

const SearchPage = () => {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [orderingState, setOrderingState] = useState("rating");
  const [filter, setFilter] = useState(false);
  const { products = [], categories = [] } = useSelector(
    (state) => state.products.searchResult
  );
  const { count } = useSelector((state) => state.products);

  const isMobile = useMediaQuery({ maxWidth: 426 });
  const location = useLocation();

  const { fetchSearchProducts, setMax, setMin, setOrdering, setSearchPage } =
    useActions();

  const handleChange = (event, value) => {
    setPage(value);
    setSearchPage(value);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const params = searchParams.get("searchValue");
    setSearchValue(params || ""); // Убедитесь, что searchValue всегда строка
  }, [location.search]);

  useEffect(() => {
    if (searchValue) {
      fetchSearchProducts(searchValue); // Убедитесь, что fetchSearchProducts не вызывает бесконечные обновления
    }
  }, [searchValue, orderingState, filter, page]);

  useEffect(() => {
    setSearchPage(page);
  }, [page]);

  return (
    <Container>
      <div className={styles.main}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 className={styles.title}>{searchValue}</h3>
            {categories.length > 0 && (
              <div className={styles.categoryDiv}>
                <img src={xIcon} alt="" />
                <p>Kategorie: {categories[0].name}</p>
              </div>
            )}
          </div>
          {!isMobile && (
            <div style={{ display: "flex", gap: "10px" }}>
              <FilterByPopularity
                setOrderingState={setOrderingState}
                setOrdering={setOrdering}
              />
              <FilterByPrice
                handleFilter={setFilter}
                filter={filter}
                setMax={setMax}
                setMin={setMin}
              />
            </div>
          )}
        </div>
        {isMobile && (
          <MobFilter
            setOrderingState={setOrderingState}
            setOrdering={setOrdering}
            handleFilter={setFilter}
            filter={filter}
            setMax={setMax}
            setMin={setMin}
          />
        )}
        <div className={styles.productDiv}>
          {products && products.length > 0 ? (
            products.map((item) => <ProductCard data={item} key={item.id} />)
          ) : (
            <NoContentText />
          )}
        </div>
        <div className={styles.paginateDiv}>
          <Pagination
            shape="rounded"
            count={Math.ceil(count / 15)} // Использование Math.ceil для округления вверх
            page={page}
            onChange={handleChange}
          />
        </div>
      </div>
    </Container>
  );
};

export default SearchPage;
