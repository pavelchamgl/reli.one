import { useNavigate } from "react-router-dom";

import Container from "../ui/Container/Container";
import returnIcon from "../assets/mobileIcons/mobReturnIcon.svg";

import styles from "../styles/MobCreateResenze.module.scss";
import MobCardSecond from "../ui/MobCardSecond/MobCardSecond";
import MobResenzeCreateForm from "../Components/Product/MobResenze/MobResenzeCreateForm/MobResenzeCreateForm";

const MobCreateResenze = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <div>
        <button onClick={() => navigate(-1)} className={styles.returnBtn}>
          <img src={returnIcon} alt="" />
          <p>Napsat recenzi</p>
        </button>
        <MobCardSecond />
        <MobResenzeCreateForm />
      </div>
    </Container>
  );
};

export default MobCreateResenze;
