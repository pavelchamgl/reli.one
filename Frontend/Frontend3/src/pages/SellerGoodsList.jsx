import { useState } from "react";

import GoodsListCard from "../Components/Seller/goods/GoodsListCard/GoodsListCard";
import SellerHeader from "../Components/Seller/sellerHeader/SellerHeader";
import GoodsSearchInp from "../ui/Seller/Goods/GoodsSearchInp/GoodsSearchInp";
import SellerPageContainer from "../ui/Seller/SellerPageContainer/SellerPageContainer";
import FilterByPopularity from "../ui/FilterByPopularity/FilterByPopularity";
import FilterByPrice from "../ui/FilterByPrice/FilterByPrice";

import styles from "../styles/SellerGoodsListPage.module.scss";
import { useActions } from "../hook/useAction";

const SellerGoodsList = () => {
  const [orderingState, setOrderingState] = useState("rating");

  const { fetchSearchProducts, setMax, setMin, setOrdering, setSearchPage } =
    useActions();

  return (
    <SellerPageContainer>
      <div style={{ paddingBottom: "100px" }}>
        <SellerHeader />
        <GoodsSearchInp />
        <div
          style={{
            display: "flex",
            marginTop: "30px",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
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

        <div className={styles.listWrap}>
          <GoodsListCard />
          <GoodsListCard />
          <GoodsListCard />
          <GoodsListCard />
          <GoodsListCard />
        </div>
      </div>
    </SellerPageContainer>
  );
};

export default SellerGoodsList;
