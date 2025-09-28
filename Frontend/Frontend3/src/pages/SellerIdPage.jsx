import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";


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
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import BannerCube from "../Components/bannerCube/BannerCube";

const SellerIdPage = () => {
    const isMobile = useMediaQuery({ maxWidth: 426 });
    const [categoryValue, setCategoryValue] = useState("");
    const [categoryId, setCategoryId] = useState(null);
    const [productsData, setProductsData] = useState([]);
    const [orderingState, setOrderingState] = useState("rating");
    const [filter, setFilter] = useState(false);
    const [page, setPage] = useState(1);

    const { t } = useTranslation();


    const { id } = useParams()

    const {
        setMax,
        setMin,
        setOrdering,
        setProdPage,
        fetchSellerProducts
    } = useActions();


    const { sellerResult,
        sellerStatus,
        count } = useSelector((state) => state.products);


    useEffect(() => {
        fetchSellerProducts(id);
    }, [orderingState, filter, page]);

    useEffect(() => {
        setProductsData(sellerResult);
    }, [sellerResult]);




    const handleChange = (event, value) => {
        setPage(value);
        setProdPage(value);
    };

    if (sellerResult?.length === 0 || sellerStatus === "error") {
        return (
            <>
                <Header />

                <BannerCube />

                <Footer />
            </>
        )
    } else {
        return (
            <>
                <Header />
                <div className={styles.titleDiv}>
                    <p className={styles.title}>Seller products</p>
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
                            products={sellerResult}
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
                                    products={sellerResult}
                                />
                            </div>
                        )}
                    </div>

                    <div className={styles.likedProdWrap}>
                        {sellerStatus === "fulfilled" && productsData && productsData.length > 0 ? (
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
                <Footer />
            </>
        );
    }

};

export default SellerIdPage;
