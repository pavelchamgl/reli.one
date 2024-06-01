import BreadCrumps from "../../../ui/BreadCrumps/BreadCrumps";
import PaymentDeliveryInp from "../PaymentDeliveryInp/PaymentDeliveryInp";
import CheckBox from "../../../ui/CheckBox/CheckBox";
import PlataRadio from "../PlataRadio/PlataRadio";
import arrLeft from "../../../assets/Payment/arrLeft.svg";

import styles from "./PaymentPlataBlock.module.scss";

const PaymentPlataBlock = () => {
  return (
    <div className={styles.main}>
      <div>
        <h3 className={styles.title}>Reli Group s.r.o</h3>
        <BreadCrumps />
      </div>
      <div className={styles.inpDiv}>
        <PaymentDeliveryInp title={"Email"} />
        <PaymentDeliveryInp title={"Dodací adresa"} />
        <PaymentDeliveryInp title={"Způsob dopravy"} />
      </div>
      <div className={styles.plataDiv}>
        <p className={styles.sectionTitle}>Platba</p>
        <PlataRadio />
        <label className={styles.checkDiv}>
          <CheckBox />
          <span>Uložte si informace pro další nákupy</span>
        </label>
      </div>
      <div className={styles.buttonDiv}>
        <button>
          <img src={arrLeft} alt="" />
          <span>Zpět do dodávka</span>
        </button>
        <button>Zaplať teď</button>
      </div>
    </div>
  );
};

export default PaymentPlataBlock;
