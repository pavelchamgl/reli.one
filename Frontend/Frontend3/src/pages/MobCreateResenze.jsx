import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useActions } from "../hook/useAction";
import { useEffect } from "react";
import { useSelector } from "react-redux";

import Container from "../ui/Container/Container";
import returnIcon from "../assets/mobileIcons/mobReturnIcon.svg";

import styles from "../styles/MobCreateResenze.module.scss";
import MobCardSecond from "../ui/MobCardSecond/MobCardSecond";
import MobResenzeCreateForm from "../Components/Product/MobResenze/MobResenzeCreateForm/MobResenzeCreateForm";

const MobCreateResenze = () => {
  const navigate = useNavigate();

  const { t } = useTranslation();

  const { id } = useParams();

  const { fetchGetProductById, fetchGetComments } = useActions();

  useEffect(() => {
    fetchGetProductById(id);
    fetchGetComments(id);
  }, [id]);

  const product = useSelector((state) => state.products.product);

  return (
    <Container>
      <div>
        <button onClick={() => navigate(-1)} className={styles.returnBtn}>
          <img src={returnIcon} alt="" />
          <p>{t("write_review")}</p>
        </button>
        {product && <MobCardSecond product={product} />}
        <MobResenzeCreateForm />
      </div>
    </Container>
  );
};

export default MobCreateResenze;
