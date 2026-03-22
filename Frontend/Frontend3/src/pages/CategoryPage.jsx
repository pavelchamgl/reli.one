import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pagination } from "@mui/material";

import { useActions } from "../hook/useAction";
import Container from "../ui/Container/Container";
import ProductCard from "../Components/Product/ProductCard/ProductCard";
import FilterByPopularity from "../ui/FilterByPopularity/FilterByPopularity";
import NoContentText from "../ui/NoContentText/NoContentText";
import FilterByPrice from "../ui/FilterByPrice/FilterByPrice";
import MobFilter from "../Components/MobFilter/MobFilter";
import CustomBreadcrumbs from "../ui/CustomBreadCrumps/CustomBreadCrumps";
import BannerCube from "../Components/bannerCube/BannerCube";

import styles from "../styles/CategoryPage.module.scss";
import Spinner from "../ui/Spiner/Spiner";
import { getProductsByCategory } from "../api/productsApi";

const CategoryPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 426 });
  const [categoryValue, setCategoryValue] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [productsData, setProductsData] = useState([]);
  const [orderingState, setOrderingState] = useState("rating");
  const [filter, setFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [isFirstLoadDone, setIsFirstLoadDone] = useState(false)
  const [isFirstEmpty, setIsFirstEmpty] = useState(false)


  const { t } = useTranslation();


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

    setCategoryId(id);

    // только проверка
    getProductsByCategory(id).then((res) => {
      const isEmpty = !res.data || res.data?.results?.length === 0;

      setIsFirstEmpty(isEmpty);
      setIsFirstLoadDone(true);
    });

  }, [id]);

  useEffect(() => {
    if (categoryId !== null) {
      setCategoryForProduct(categoryId);
      setProdPage(1)
      fetchGetProducts()
    }
  }, [categoryId, orderingState, filter, page]);

  const { products, count, status } = useSelector((state) => state.products);

  useEffect(() => {
    setProductsData(products);
  }, [products]);



  const handleChange = (event, value) => {
    setPage(value);
    setProdPage(value);
  };



  return (
    <>

      <Container>
        {
          !isFirstEmpty ?
            <>
              <div className={styles.titleDiv}>
                <p className={styles.title}>{t(`categories.${id}`, { defaultValue: categoryValue })}</p>
              </div>
              {
                isMobile && (
                  <MobFilter
                    setOrderingState={setOrderingState}
                    setOrdering={setOrdering}
                    handleFilter={setFilter}
                    filter={filter}
                    setMax={setMax}
                    setMin={setMin}
                    products={products}
                  />
                )
              }

              < div className={styles.filterDiv}>
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
            </>
            : null
        }

        <>
          {status === "loading" || !isFirstLoadDone ? (
            <div className={styles.spinnerWrap}>
              <Spinner size="50px" />
            </div>
          ) : (
            <div className={styles.likedProdWrap}>

              {/* 1. ПЕРВАЯ ЗАГРУЗКА КАТЕГОРИИ */}
              {isFirstEmpty ? (
                <BannerCube />
              ) : productsData.length > 0 ? (

                /* 2. ЕСТЬ ТОВАРЫ */
                productsData.map((item) => (
                  <ProductCard key={item.id} data={item} />
                ))

              ) : (

                /* 3. ФИЛЬТРЫ ДАЛИ 0 */
                <NoContentText />

              )}

            </div>
          )}
        </>

        {
          productsData && productsData.length > 0 ?
            <div className={styles.paginationDiv}>
              <Pagination
                shape="rounded"
                count={Math.ceil(count / 35)} // Использование Math.ceil для округления вверх
                page={page}
                onChange={handleChange}
              />
            </div>
            : null

        }
      </Container >
    </>
  );
};

export default CategoryPage;
