import BreadCrumps from "../../../ui/BreadCrumps/BreadCrumps";
import PaymentDeliveryInp from "../PaymentDeliveryInp/PaymentDeliveryInp";
import PaymentDeliverySelect from "../PaymentDeliverySelect/PaymentDeliverySelect";
import arrLeft from "../../../assets/Payment/arrLeft.svg";

import styles from "./PaymentDeliveryBlock.module.scss";

const PaymentDeliveryBlock = () => {
  return (
    <div className={styles.main}>
      <div>
        <h3 className={styles.title}>Reli Group s.r.o</h3>
        <BreadCrumps />
      </div>
      <div className={styles.inpDiv}>
        <PaymentDeliveryInp title={"Email"} />
        <PaymentDeliveryInp title={"Dodací adresa"} />
      </div>
      <div>
        <p className={styles.sectionTitle}>Dodávka</p>
        <PaymentDeliverySelect />
      </div>
      <div className={styles.buttonDiv}>
        <button>
          <img src={arrLeft} alt="" />
          <span>Zpět do nákupního košíku</span>
        </button>
        <button>Pokračujte v odeslání</button>
      </div>
    </div>
  );
};

export default PaymentDeliveryBlock;
