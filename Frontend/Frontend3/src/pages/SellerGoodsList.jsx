import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive"
import { useSelector } from "react-redux";
import { Pagination } from "@mui/material";

import { useActionSellerList } from "../hook/useActionSellerList";

import GoodsListCard from "../Components/Seller/goods/GoodsListCard/GoodsListCard";
import GoodsSearchInp from "../ui/Seller/Goods/GoodsSearchInp/GoodsSearchInp";
import FilterByPopularity from "../ui/FilterByPopularity/FilterByPopularity";
import GoodsTub from "../Components/Seller/goods/goodsTub/GoodsTub";
import GoodsCardModer from "../Components/Seller/goods/goodsCardModer/GoodsCardModer";
import GoodsCardNotModer from "../Components/Seller/goods/goodsCardNotModer/GoodsCardNotModer";
import FilterByPrice from "../ui/FilterByPrice/FilterByPrice";
import MobFilter from "../Components/MobFilter/MobFilter";
import Spinner from "../ui/Spiner/Spiner";

import styles from "../styles/SellerGoodsListPage.module.scss";
import NoContentText from "../ui/NoContentText/NoContentText";

const SellerGoodsList = () => {
  const [orderingState, setOrderingState] = useState("rating");
  const [page, setPage] = useState(1);
  const [goodsStatus, setGoodsStatus] = useState("active")
  const [filter, setFilter] = useState(false);
  const [makeSearch, setMakeSearch] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { setOrdering, setMax, setMin, setStatus, setProdPage, fetchGetGoodsList } =
    useActionSellerList();

  const { count, products, status } = useSelector((state) => state.seller_goods);


  const handleChange = (event, value) => {
    setPage(value)
    setProdPage(value);
  };

  const isMobile = useMediaQuery({ maxWidth: 426 })

  useEffect(() => {
    if (goodsStatus === "active") {
      setStatus("approved")
    }
    if (goodsStatus === "moder") {
      setStatus("pending")
    }
    if (goodsStatus === "notModer") {
      setStatus("rejected")
    }
  }, [goodsStatus])


  useEffect(() => {
    fetchGetGoodsList()
  }, [orderingState, page, goodsStatus, filter, makeSearch])

  useEffect(() => {
    if (status === "pending") {
      setIsLoading(true)
    } else {
      setIsLoading(false)
    }
  }, [status])


  return (
    <div style={{ paddingBottom: "100px" }}>
      <GoodsSearchInp makeSearch={makeSearch} setMakeSearch={setMakeSearch} />
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          marginTop: "30px",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <GoodsTub status={goodsStatus} setStatus={setGoodsStatus} />
        {
          !isMobile && (
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
          )
        }
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
      </div>
      {
        status === "pending" ? (
          <div className={styles.spinnerDiv}>
            <Spinner size="40px" />
          </div>
        ) : status === "rejected" ? (
          <div className={styles.errorDiv}>
            <p>
              Oops! Something went wrong on our end. Please try again later.
            </p>
          </div>
        ) : (
          <div className={styles.listWrap}>
            {goodsStatus === "active" && products?.length > 0 ? (
              products.map((item, index) => (
                <GoodsListCard key={index} isLoading={isLoading} item={item} />
              ))
            ) : goodsStatus === "active" ? (
              <NoContentText />
            ) : goodsStatus === "moder" && products?.length > 0 ? (
              products.map((item, index) => (
                <GoodsCardModer key={index} isLoading={isLoading} item={item} />
              ))
            ) : goodsStatus === "moder" ? (
              <NoContentText />
            ) : goodsStatus === "notModer" && products?.length > 0 ? (
              products.map((item, index) => (
                <GoodsCardNotModer key={index} isLoading={isLoading} item={item} />
              ))
            ) : goodsStatus === "notModer" ? (
              <NoContentText />
            ) : null}
          </div>
        )
      }




      {status !== "pending" && count > 0 && (
        <div className={styles.paginateDiv}>
          <Pagination
            shape="rounded"
            count={Math.ceil(count / 15)} // Использование Math.ceil для округления вверх
            page={page}
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  );
};

export default SellerGoodsList;
