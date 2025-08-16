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
            <h4 className={styles.textTitle} >
              {t("marketplaceReli.title")}
            </h4>
            <p className={styles.textDesc}>
              {t("marketplaceReli.at")} <span>{t("marketplaceReli.market")}</span>{t("marketplaceReli.other_text")} </p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} id="mission" style={{ textDecoration: "underline" }}>
              {t("our_mission")}
            </h4>
            <p className={styles.textDesc}>{t("our_mission_text")}</p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }} id="weAre">
              {t("who_we_are")}
            </h4>
            <p className={styles.textDesc}>{t("who_we_are_text")}</p>
          </div>


          <div id="sets" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("what_sets_us")}</h4>
            <p className={styles.textDesc}>
              <span>{t("trust_safety")}</span>
              {t("what_sets_us_first")}
            </p>
            <p className={styles.textDesc} style={{ margin: "5px 0" }}>
              <span>{t("diverse_product_range")}</span>
              {t("what_sets_us_second")}
            </p>
            <p className={styles.textDesc}>
              <span>{t("unparalleled_support")}</span>
              {t("what_sets_us_third")}
            </p>
          </div>

          <div id="values" className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("our_values")}</h4>
            <p className={styles.textDesc}>
              <span>{t("integrity")} </span>
              {t("our_values_first")}</p>
            <p className={styles.textDesc} >
              <span>{t("innovation")}</span>
              {t("our_values_second")}
            </p>
            <p className={styles.textDesc}>
              <span>{t("community")}</span>
              {t("our_values_third")}
            </p>
            <p className={styles.textDesc}>
              <span>{t("sustainability")}</span>
              {t("our_values_4")}
            </p>
          </div>

          <div id="account" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>{t("account_information")}</h4>
            <p className={styles.textDesc}>{t("how_start_desc")}</p>

            <strong className={styles.textDesc} style={{ fontWeight: "700" }}>{t("steps_to_create_account")}</strong>

            <ol className={styles.newList}>
              <li>
                <span>{t("step1_title")}</span>
                {t("step1_text.click")}
                <span>{t("step1_text.sign")}</span>
                {t("step1_text.or")}
                <span>{t("step1_text.register")}</span>
                {t("step1_text.other_text")}
              </li>
              <li>
                <span>{t("step2_title")}</span> {t("step2_text")}
              </li>
              <li>
                <span>{t("step3_title")}</span> {t("step3_text")}
              </li>
              <li>
                <span>{t("step4_title")}</span> {t("step4_text")}
              </li>
              <li>
                <span>{t("step5_title")}</span> {t("step5_text")}
              </li>
            </ol>

            {/* <p className={styles.textDesc}>1. {t("first_step")}</p>
            <p className={styles.textDescLight}>{t("first_step_desc")}</p>
            <p className={styles.textDesc}>2. {t("second_step")}</p>
            <p className={styles.textDescLight}>{t("second_step_desc")}</p>
            <p className={styles.textDesc}>3. {t("third_step")}</p>
            <p className={styles.textDescLight}>{t("third_step_desc")}</p>
            <p className={styles.textDesc}>4. {t("fourth_step")}</p>
            <p className={styles.textDescLight}>{t("fourth_step_desc")}</p>
            <p className={styles.textDesc}>5. {t("fifth_step")}</p>
            <p className={styles.textDescLight}>{t("fifth_step_desc")}</p> */}

            <p className={styles.textDesc} style={{ fontWeight: "700" }}>{t("benefits_title")}</p>
            {/* <p className={styles.textDescLight}>a) {t("benefits_first")}</p>
            <p className={styles.textDescLight}>b) {t("benefits_second")}</p>
            <p className={styles.textDescLight}>c) {t("benefits_third")}</p> */}

            <ul className={styles.newList}>
              <li>
                <span>{t("benefit1_title")}</span>{t("benefit1_text")}
              </li>
              <li>
                <span>{t("benefit2_title")}</span>{t("benefit2_text")}
              </li>
              <li>
                <span>{t("benefit3_title")}</span>{t("benefit3_text")}
              </li>

            </ul>

          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("security_title")}</h4>
            <p className={styles.textDesc}>{t("security_desc")}</p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("need_help_title")}</h4>
            <p className={styles.textDesc}>{t("need_help_text")}
              <a href="mailto:support600.reli@gmail.com" className={styles.emailText}>{t("need_help_text_email")}</a>.
            </p>
          </div>

          <div id="purchase" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("make_purchase")}</h4>
            <p className={styles.textDesc}>{t("make_purchase_title")}</p>

            <ol className={styles.newList}>
              <li>
                <span>{t("purchase_step1_title")}</span>{t("purchase_step1_text")}
              </li>
              <li>
                <span>{t("purchase_step2_title")}</span>{t("purchase_step2_text")}
              </li>
              <li>
                <span>{t("purchase_step3_title")}</span>{t("purchase_step3_text")}
              </li>
              <li>
                <span>{t("purchase_step4_title")}</span>{t("purchase_step4_text")}
              </li>
              <li>
                <span>{t("purchase_step5_title")}</span>{t("purchase_step5_text")}
              </li>
              <li>
                <span>{t("purchase_step6_title")}</span>{t("purchase_step6_text")}
              </li>
              <li>
                <span>{t("purchase_step7_title")}</span>{t("purchase_step7_text")}
              </li>
              <li>
                <span>{t("purchase_step8_title")}</span>{t("purchase_step8_text")}
              </li>
            </ol>

            {/* <p className={styles.textDesc}>
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
            </p> */}
            {/* <p className={styles.textDescLight}>
              {t("purchase_eighth_step_desc")}
            </p> */}
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("buy_support_title")}</h4>
            <p className={styles.textDesc}>{t("support_text")}
              <a href="mailto:support600.reli@gmail.com" className={styles.emailText}>{t("support_text_email")}</a>.
            </p>
          </div>

          <div id="delivery" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("delivery_options")}</h4>
            <p className={styles.textDesc}>{t("delivery_title")}</p>
            <p className={styles.textDesc}>
              <span>{t("delivery_courier_title")}</span>
              {t("delivery_first_desc")}
            </p>
            <p className={styles.textDesc}>
              <span>{t("delivery_warehouse_title")}</span>
              {t("delivery_second_desc")}
            </p>
            <p className={styles.textDesc}>
              <span>{t("delivery_international_title")}</span>
              {t("delivery_third_desc")}
            </p>
            <p className={styles.textDesc}>
              <span>{t("delivery_tracking_title")}</span>
              {t("delivery_fourth_desc")}
            </p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("shipping_questions_title")}</h4>
            <p className={styles.textDesc}>{t("shipping_questions_text")} <a href="mailto:support600.reli@gmail.com" className={styles.emailText}>{t("shipping_questions_email")}</a> {t("shipping_questions_other")}
            </p>
          </div>

          <div id="payment" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("payment_options")}</h4>
            <p className={styles.textDesc}>{t("payment_title")}</p>
            <p className={styles.textDesc}>
              <span>{t("payment_online_title")} </span>
              {t("payment_first_desc")}
            </p>
            <p className={styles.textDesc}>
              <span>{t("payment_cash_title")}</span>
              {t("payment_cash_text")}
              <span>{t("payment_cash_pickup")}</span>
              {t("payment_cash_other")}
            </p>
            <p className={styles.textDesc}>
              <span>{t("payment_secure_title")} </span>
              {t("payment_third_desc")}
            </p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("payment_support_title")}</h4>
            <p className={styles.textDesc}>
              {t("payment_support_text")}
              <a href="mailto:support600.reli@gmail.com" className={styles.emailText}>{t("payment_support_email")}</a>
            </p>
          </div>

        </div>
      </div>
    </Container>
  );
};

export default ForBuyersPage;
