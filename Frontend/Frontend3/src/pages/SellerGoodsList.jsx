import { useState } from "react";
import { useActions } from "../hook/useAction";
import { useMediaQuery } from "react-responsive"

import GoodsListCard from "../Components/Seller/goods/GoodsListCard/GoodsListCard";
import GoodsSearchInp from "../ui/Seller/Goods/GoodsSearchInp/GoodsSearchInp";
import FilterByPopularity from "../ui/FilterByPopularity/FilterByPopularity";
import GoodsTub from "../Components/Seller/goods/goodsTub/GoodsTub";
import GoodsCardModer from "../Components/Seller/goods/goodsCardModer/GoodsCardModer";
import GoodsCardNotModer from "../Components/Seller/goods/goodsCardNotModer/GoodsCardNotModer";

import styles from "../styles/SellerGoodsListPage.module.scss";

const SellerGoodsList = () => {
  const [orderingState, setOrderingState] = useState("rating");

  const [goodsStatus, setGoodsStatus] = useState("active")

  const { fetchSearchProducts, setMax, setMin, setOrdering, setSearchPage } =
    useActions();

  const isMobile = useMediaQuery({ maxWidth: 426 })

  return (
    <div style={{ paddingBottom: "100px" }}>
      <GoodsSearchInp />
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
        <div>

          <FilterByPopularity
            setOrderingState={setOrderingState}
            setOrdering={setOrdering}
          />
          {/* <FilterByPrice
          handleFilter={setFilter}
          filter={filter}
          setMax={setMax}
          setMin={setMin}
          products={products}
        /> */}
        </div>
      </div>

      <div className={styles.listWrap}>
        {
          goodsStatus === "active" &&
          <>
            <GoodsListCard />
            <GoodsListCard />
            <GoodsListCard />
            <GoodsListCard />
            <GoodsListCard />
          </>

        }
        {
          goodsStatus === "moder" &&
          <>
            <GoodsCardModer />
            <GoodsCardModer />
            <GoodsCardModer />
            <GoodsCardModer />
            <GoodsCardModer />
          </>
        }
        {
          goodsStatus === "notModer" &&
          <>
            <GoodsCardNotModer />
            <GoodsCardNotModer />
            <GoodsCardNotModer />
            <GoodsCardNotModer />
            <GoodsCardNotModer />
          </>
        }


      </div>
    </div>
  );
};

export default SellerGoodsList;
