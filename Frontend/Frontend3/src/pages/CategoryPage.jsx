import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";

import Container from "../ui/Container/Container";
import ProductCard from "../Components/Product/ProductCard/ProductCard";
import FilterByPopularity from "../ui/FilterByPopularity/FilterByPopularity";
import NoContentText from "../ui/NoContentText/NoContentText";
import FilterByPrice from "../ui/FilterByPrice/FilterByPrice";
import MobFilter from "../Components/MobFilter/MobFilter";

import styles from "../styles/CategoryPage.module.scss";
import { useActions } from "../hook/useAction";
import { Pagination } from "@mui/material";
import CustomBreadcrumbs from "../ui/CustomBreadCrumps/CustomBreadCrumps";

const CategoryPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 426 });
  const [categoryValue, setCategoryValue] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [productsData, setProductsData] = useState([]);
  const [orderingState, setOrderingState] = useState("rating");
  const [filter, setFilter] = useState(false);
  const [page, setPage] = useState(1);

  const { id } = useParams()

  const {
    fetchGetProducts,
    setCategoryForProduct,
    setMax,
    setMin,
    setOrdering,
    setProdPage,
  } = useActions();

  const { search } = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const searchText = searchParams.get("categoryValue");
    const categoryID = searchParams.get("categoryID");
    if (categoryID && searchText) {
      setCategoryId(Number(categoryID));
      setCategoryValue(searchText);
    }
  }, [search]);

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const searchText = searchParams.get("categoryValue");
    if (searchText) {
      setCategoryValue(searchText);
    }
    setCategoryId(id)
  }, [id])

  useEffect(() => {
    if (categoryId !== null) {
      setCategoryForProduct(categoryId);
      setProdPage(1)
      fetchGetProducts();
    }
  }, [categoryId, categoryValue, orderingState, filter, page]);

  const { products, count } = useSelector((state) => state.products);

  useEffect(() => {
    setProductsData(products);
  }, [products]);


  const handleChange = (event, value) => {
    setPage(value);
    setProdPage(value);
  };

  return (
    <>
      <div className={styles.titleDiv}>
        <p className={styles.title}>{categoryValue}</p>
      </div>

      <Container>
        {isMobile && (
          <MobFilter
            setOrderingState={setOrderingState}
            setOrdering={setOrdering}
            handleFilter={setFilter}
            filter={filter}
            setMax={setMax}
            setMin={setMin}
            products={products}
          />
        )}
        <div className={styles.filterDiv}>
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
                products={products}
              />
            </div>
          )}
        </div>
        <div className={styles.breadHide}>
          <CustomBreadcrumbs />
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
        <div className={styles.paginationDiv}>
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

export default CategoryPage;
