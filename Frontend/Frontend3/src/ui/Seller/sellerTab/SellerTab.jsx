import { useLocation, useNavigate } from "react-router-dom";

import styles from "./SellerTab.module.scss";

const SellerTab = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className={styles.main}>
      <button
        className={
          pathname === "/seller-home" ? styles.tabBtnAcc : styles.tabBtn
        }
        onClick={() => navigate("/seller-home")}
      >
        Home
      </button>
      <button
        className={
          pathname === "/seller-goods-choice" ||
          pathname === "/seller-goods-list" ||
          pathname === "/seller-preview" ||
          pathname === "/seller-create"
            ? styles.tabBtnAcc
            : styles.tabBtn
        }
        onClick={() => navigate("/seller-goods-choice")}
      >
        Goods
      </button>
      <button
        className={
          pathname === "/seller-orders" ? styles.tabBtnAcc : styles.tabBtn
        }
        onClick={() => navigate("/seller-orders")}
      >
        Orders
      </button>
    </div>
  );
};

export default SellerTab;
