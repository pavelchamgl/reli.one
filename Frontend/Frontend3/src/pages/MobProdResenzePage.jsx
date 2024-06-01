import { useState } from "react";
import { Pagination } from "@mui/material";

import MobResenzeCommentWrap from "../Components/Product/MobResenze/MobResenzeCommentWrap/MobResenzeCommentWrap";
import MobResenzeRate from "../Components/Product/MobResenze/MobResenzeRate/MobResenzeRate";
import returnIcon from "../assets/mobileIcons/mobReturnIcon.svg";
import Container from "../ui/Container/Container";
import MobCardSecond from "../ui/MobCardSecond/MobCardSecond";

import styles from "../styles/MobProdResenzePage.module.scss";

const MobProdResenzePage = () => {
  const [page, setPage] = useState(4);

  const handlePageChange = (event, value) => {
    setPage(value);
    // Здесь вы можете выполнить дополнительные действия при смене страницы
  };

  return (
    <Container>
      <div className={styles.main}>
        <button className={styles.returnBtn}>
          <img src={returnIcon} alt="" />
          <p>Recenze</p>
        </button>
        <MobCardSecond />
        <MobResenzeRate />
        <MobResenzeCommentWrap />
        <Pagination
          page={page}
          onChange={handlePageChange}
          count={10}
          shape="rounded"
        />
      </div>
    </Container>
  );
};

export default MobProdResenzePage;
