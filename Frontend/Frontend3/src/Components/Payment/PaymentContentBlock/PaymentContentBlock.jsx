import Checkbox from "../../../ui/CheckBox/CheckBox";
import BreadCrumps from "../../../ui/BreadCrumps/BreadCrumps";
import PaymentInp from "../../../ui/PaymentInp/PaymentInp";

import arrLeft from "../../../assets/Payment/arrLeft.svg"

import styles from "./PaymentContentBlock.module.scss";

const PaymentContentBlock = () => {
  return (
    <div className={styles.main}>
      <div>
        <h3 className={styles.title}>Reli Group s.r.o</h3>
        <BreadCrumps />
      </div>
      <PaymentInp title={"Email"} />
      <div className={styles.adressDiv}>
        <h3 className={styles.sectionTitle}>Dodací adresa</h3>
        <PaymentInp title={"Země/oblast"} />
        <div className={styles.smallInpDiv}>
          <PaymentInp title={"Jméno"} />
          <PaymentInp title={"Příjmení"} />
        </div>
        <PaymentInp title={"Adresa"} />
        <PaymentInp title={"Telefon"} />
        <label className={styles.checkDiv}>
          <Checkbox />
          <span>Uložte si informace pro další nákupy</span>
        </label>
      </div>
      <div className={styles.buttonDiv}>
        <button>
            <img src={arrLeft} alt="" />
            <span>Zpět do nákupního košíku</span>
        </button>
        <button>
        Pokračujte v odeslání
        </button>
      </div>
    </div>
  );
};

export default PaymentContentBlock;
