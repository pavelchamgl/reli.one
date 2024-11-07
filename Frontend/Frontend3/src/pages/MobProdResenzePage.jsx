import { useState, useEffect } from "react";
import { Pagination } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useActions } from "../hook/useAction";
import { useSelector } from "react-redux";

import MobResenzeCommentWrap from "../Components/Product/MobResenze/MobResenzeCommentWrap/MobResenzeCommentWrap";
import MobResenzeRate from "../Components/Product/MobResenze/MobResenzeRate/MobResenzeRate";
import returnIcon from "../assets/mobileIcons/mobReturnIcon.svg";
import Container from "../ui/Container/Container";
import MobCardSecond from "../ui/MobCardSecond/MobCardSecond";
import MobResenzeBtn from "../Components/Product/MobResenze/MobResenzeBtn/MobResenzeBtn";

import styles from "../styles/MobProdResenzePage.module.scss";

const MobProdResenzePage = () => {
  const [page, setPage] = useState(4);

  const currentSku = JSON.parse(localStorage.getItem("currentSku")) || "";

  const navigate = useNavigate();

  const { t } = useTranslation();

  const { id } = useParams();

  const { fetchGetProductById, fetchGetComments, setCommentPage } =
    useActions();

  useEffect(() => {
    fetchGetProductById(id);
    fetchGetComments(id);
  }, [id, page]);

  const product = useSelector((state) => state.products.product);
  const { count } = useSelector((state) => state.comment);

  const handlePageChange = (event, value) => {
    setPage(value);
    setCommentPage(value);
    // Здесь вы можете выполнить дополнительные действия при смене страницы
  };

  console.log(product);

  return (
    <>
      <Container>
        <div className={styles.main}>
          <button onClick={() => navigate(-1)} className={styles.returnBtn}>
            <img src={returnIcon} alt="" />
            <p>{t("review")}</p>
          </button>
          <MobCardSecond product={product} sku={currentSku} />
          <MobResenzeRate />
          <MobResenzeCommentWrap />
          <Pagination
            shape="rounded"
            count={Math.ceil(count / 5)} // Использование Math.ceil для округления вверх
            page={page}
            onChange={handlePageChange}
          />
        </div>
      </Container>
      <MobResenzeBtn />
    </>
  );
};

export default MobProdResenzePage;
