import { useState } from "react";
import { useTranslation } from "react-i18next";

import Container from "../ui/Container/Container";

import styles from "../styles/ForSellerPage.module.scss";

const ForBuyersPage = () => {
  const [section, setSection] = useState("weAre");

  const { t } = useTranslation();

  return (
    <Container>
      <div className={styles.main}>
        <p className={styles.title}>{t("for_buyers")}</p>
        <div className={styles.container}>
          <div className={styles.linkDivForBuy}>
            <a
              style={{ color: section === "weAre" ? "#3f7f6d" : "#000" }}
              className={styles.linkItem}
              onClick={() => setSection("weAre")}
              href="#weAre"
            >
              1. {t("who_we_are_list")}
            </a>
            <a
              style={{ color: section === "mission" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("mission")}
              className={styles.linkItem}
              href="#mission"
            >
              1.1.{t("our_mission")}
            </a>
            <a
              className={styles.linkItem}
              href="#sets"
              style={{ color: section === "sets" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("sets")}
            >
              1.2.{t("what_sets_us")}
            </a>
            <a
              className={styles.linkItem}
              href="#values"
              style={{ color: section === "values" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("values")}
            >
              1.3.{t("our_values")}
            </a>
            <a
              className={styles.linkItem}
              href="#account"
              style={{ color: section === "account" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("account")}
            >
              2. {t("account_information")}
            </a>
            <a
              className={styles.linkItem}
              href="#purchase"
              style={{ color: section === "purchase" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("purchase")}
            >
              3. {t("make_purchase")}
            </a>
            <a
              className={styles.linkItem}
              href="#delivery"
              style={{ color: section === "delivery" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("delivery")}
            >
              4. {t("delivery_options")}
            </a>
            <a
              className={styles.linkItem}
              href="#payment"
              style={{ color: section === "payment" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("payment")}
            >
              5. {t("payment_options")}
            </a>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} id="weAre">
              {t("who_we_are")}
            </h4>
            <p className={styles.textDesc}>{t("who_we_are_text")}</p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} id="mission">
              {t("our_mission")}:
            </h4>
            <p className={styles.textDesc}>{t("our_mission_text")}</p>
          </div>

          <div id="sets" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("what_sets_us")}:</h4>
            <p className={styles.textDesc}>{t("what_sets_us_first")}</p>
            <p className={styles.textDesc} style={{ margin: "15px 0" }}>
              {t("what_sets_us_second")}
            </p>
            <p className={styles.textDesc}>{t("what_sets_us_third")}</p>
          </div>

          <div id="values" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("our_values")}</h4>
            <p className={styles.textDesc}>{t("our_values_first")}</p>
            <p className={styles.textDesc} style={{ margin: "15px 0" }}>
              {t("our_values_second")}
            </p>
            <p className={styles.textDesc}>{t("our_values_third")}</p>
          </div>

          <div id="account" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>{t("account_information")}</h4>
            <p className={styles.textDesc}>{t("how_start_desc")}</p>
            <p className={styles.textDesc}>1. {t("first_step")}</p>
            <p className={styles.textDescLight}>{t("first_step_desc")}</p>
            <p className={styles.textDesc}>2. {t("second_step")}</p>
            <p className={styles.textDescLight}>{t("second_step_desc")}</p>
            <p className={styles.textDesc}>3. {t("third_step")}</p>
            <p className={styles.textDescLight}>{t("third_step_desc")}</p>
            <p className={styles.textDesc}>4. {t("fourth_step")}</p>
            <p className={styles.textDescLight}>{t("fourth_step_desc")}</p>
            <p className={styles.textDesc}>5. {t("fifth_step")}</p>
            <p className={styles.textDescLight}>{t("fifth_step_desc")}</p>
            <p className={styles.textDescLight}>{t("benefits_title")}:</p>
            <p className={styles.textDescLight}>a) {t("benefits_first")}</p>
            <p className={styles.textDescLight}>b) {t("benefits_second")}</p>
            <p className={styles.textDescLight}>c) {t("benefits_third")}</p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("security_title")}:</h4>
            <p className={styles.textDesc}>{t("security_desc")}</p>
          </div>

          <div id="purchase" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>{t("make_purchase")}</h4>
            <p className={styles.textDesc}>{t("make_purchase_title")}</p>
            <p className={styles.textDesc}>
              1. {t("purchase_first_step_title")}:
            </p>
            <p className={styles.textDescLight}>
              {t("purchase_first_step_desc")}
            </p>
            <p className={styles.textDesc}>
              2. {t("purchase_second_step_title")}:
            </p>
            <p className={styles.textDescLight}>
              {t("purchase_second_step_desc")}
            </p>
            <p className={styles.textDesc}>
              3. {t("purchase_third_step_title")}:
            </p>
            <p className={styles.textDescLight}>
              {t("purchase_third_step_desc")}
            </p>
            <p className={styles.textDesc}>
              4.{t("purchase_fourth_step_title")}:
            </p>
            <p className={styles.textDescLight}>
              {t("purchase_fourth_step_desc")}
            </p>
            <p className={styles.textDesc}>
              5. {t("purchase_fifth_step_title")}:
            </p>
            <p className={styles.textDescLight}>
              {t("purchase_fifth_step_desc")}
            </p>
            <p className={styles.textDesc}>
              6. {t("purchase_sixth_step_title")}:
            </p>
            <p className={styles.textDescLight}>
              {t("purchase_sixth_step_desc")}
            </p>
            <p className={styles.textDesc}>
              7. {t("purchase_seventh_step_title")}:
            </p>
            <p className={styles.textDescLight}>
              {t("purchase_seventh_step_desc")}
            </p>
            <p className={styles.textDesc}>
              8. {t("purchase_eighth_step_title")}:
            </p>
            <p className={styles.textDescLight}>
              {t("purchase_eighth_step_desc")}
            </p>
          </div>

          <div id="delivery" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>{t("delivery_options")}</h4>
            <p className={styles.textDesc}>{t("delivery_title")}</p>
            <p className={styles.textDescLight}>{t("delivery_first_title")}</p>
            <p className={styles.textDesc}>{t("delivery_first_desc")}</p>
            <p className={styles.textDescLight}>{t("delivery_second_title")}</p>
            <p className={styles.textDesc}>{t("delivery_second_desc")}</p>
            <p className={styles.textDescLight}>{t("delivery_third_title")}</p>
            <p className={styles.textDesc}>{t("delivery_third_desc")}</p>
            <p className={styles.textDescLight}>{t("delivery_fourth_title")}</p>
            <p className={styles.textDesc}>{t("delivery_fourth_desc")}</p>
          </div>

          <div id="payment" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>{t("payment_options")}</h4>
            <p className={styles.textDesc}>{t("payment_title")}</p>
            <p className={styles.textDescLight}>{t("payment_first_title")}</p>
            <p className={styles.textDesc}>{t("payment_first_desc")}</p>
            <p className={styles.textDescLight}>{t("payment_second_title")}</p>
            <p className={styles.textDesc}>{t("payment_second_desc")}</p>
            <p className={styles.textDescLight}>{t("payment_third_title")}</p>
            <p className={styles.textDesc}>{t("payment_third_desc")}</p>
            <p className={styles.textDesc}>
              {t("support_title")}
              <span className={styles.emailText}>
                support600.reli@gmail.com
              </span>
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ForBuyersPage;
