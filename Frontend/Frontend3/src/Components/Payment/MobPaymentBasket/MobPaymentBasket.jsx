import { useState } from "react";

import greenBasketIcon from "../../../assets/mobileIcons/greenBasketIcon.svg";
import arrBottom from "../../../assets/mobileIcons/arrBotomGreen.svg";
import arrRight from "../../../assets/mobileIcons/arrRightGreen.svg";

import BasketTotalBlock from "../../Basket/BasketTotalBlock/BasketTotalBlock";
import MobCardSecond from "../../../ui/MobCardSecond/MobCardSecond";

import styles from "./MobPaymentBasket.module.scss";
import { useSelector } from "react-redux";

const MobPaymentBasket = () => {
  const [open, setOpen] = useState(false);
  const selectedProducts = useSelector(
    (state) => state.basket.selectedProducts
  );


  return (
    <div>
      <button
        style={{ margin: open ? "14px 0px 0px 0px" : "14px 0" }}
        onClick={() => setOpen(!open)}
        className={styles.openBtn}
      >
        <div>
          <img src={greenBasketIcon} alt="" />
          <p>Nákupní košík</p>
        </div>
        <img src={open ? arrBottom : arrRight} alt="" />
      </button>
      {open && (
        <div>
          {selectedProducts &&
            selectedProducts.length > 0 &&
            selectedProducts.map((item) => (
              <MobCardSecond key={item.sku} product={item?.product} sku={item?.sku} />
            ))}
          <BasketTotalBlock />
        </div>
      )}
    </div>
  );
};

export default MobPaymentBasket;
