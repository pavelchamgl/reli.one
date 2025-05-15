import { useState } from "react";
import { useTranslation } from "react-i18next";

import Container from "../ui/Container/Container";
import ForSellerTable from "../ui/ForSellerTable/ForSellerTable";

import styles from "../styles/ForSellerPage.module.scss";

const ForrSellerPage = () => {
  const [section, setSection] = useState("market");

  const { t } = useTranslation();

  return (
    <Container>
      <div className={styles.main}>
        <p className={styles.title}>{t("for_seller")}</p>

        <div className={styles.container}>

          <div className={styles.linkDiv}>
            <a
              className={styles.linkItem}
              href="#market"
              style={{ color: section === "market" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("market")}
            >
              1.  {t("who_we_are_list")}
            </a>
            <a
              className={styles.linkItem}
              href="#choose"
              style={{ color: section === "choose" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("choose")}
            >
              1.1.  {t("why_choose_title")}
            </a>
            <a
              className={styles.linkItem}
              href="#info"
              style={{ color: section === "info" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("info")}
            >
              2.  {t("info_for_seller_title")}
            </a>
            <a
              className={styles.linkItem}
              href="#category"
              style={{ color: section === "category" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("category")}
            >
              2.2 {t("cost_by_category")}
            </a>
            <a
              className={styles.linkItem}
              href="#start"
              style={{ color: section === "start" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("start")}
            >
              3.  {t("start_selling_title")}
            </a>
          </div>

          <div id="market" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("who_we_are")}</h4>
            <p className={styles.textDesc}>
              At <span>Marketplace Reli</span>, our mission is to provide a seamless, secure, and efficient
              platform where buyers and sellers can connect, transact, and grow together.
              Whether you're in search of unique products, unbeatable deals, or a space to
              showcase your offerings, we are here to deliver an exceptional user experience.
              Marketplace Reli is more than just an e-commerce platform - we are a dynamic
              team of innovators, technology enthusiasts, and customer-centric professionals.
              Our commitment lies in building a trusted, transparent, and user-friendly
              environment for everyone involved.
            </p>
          </div>

          <div id="choose" className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{
              textDecoration: "underline"
            }}>{t("why_choose_title")}</h4>


            <div className={styles.newTextWrap}>
              <h4>European Reach, Global Impact </h4>
              <p>{t("why_choose_list_1")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Empower Your Business </h4>
              <p>{t("why_choose_list_2")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Fair and Transparent Fee Structure</h4>
              <p>{t("why_choose_list_3")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Promote Your Brand</h4>
              <p>{t("why_choose_list_4")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Reduced Marketing Costs</h4>
              <p>{t("why_choose_list_5")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Customer Reviews and Feedback</h4>
              <p>{t("why_choose_list_6")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Secure Transactions</h4>
              <p>{t("why_choose_list_7")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Dedicated Support Team</h4>
              <p>{t("why_choose_list_8")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Competitive Advantage</h4>
              <p>{t("why_choose_list_9")}</p>
            </div>

            {/* <ul className={styles.listDiv
            } >

              <li>{t("why_choose_list_2")}</li>
              <li>{t("why_choose_list_3")}</li>
              <li>{t("why_choose_list_4")}</li>
              <li>{t("why_choose_list_5")}</li>
              <li>{t("why_choose_list_6")}</li>
              <li>{t("why_choose_list_7")}</li>
              <li>{t("why_choose_list_8")}</li>
              <li>{t("why_choose_list_9")}</li>
            </ul> */}
          </div>

          <div id="info" className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{
              textDecoration: "underline"
            }}>{t("info_for_seller_title")}</h4>
            <p className={styles.textDesc} style={{ marginBottom: "10px" }}>
              {t("info_for_seller_desc")}
            </p>

            <div className={styles.newTextWrap}>
              <h4>Product Category</h4>
              <p>{t("info_for_seller_list_1")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Sales Volume</h4>
              <p>{t("info_for_seller_list_2")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Value-Added Services</h4>
              <p>{t("info_for_seller_list_3")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Promotional Discounts </h4>
              <p>{t("info_for_seller_list_4")}</p>
            </div>

            {/* <ul className={styles.listDiv}>
              <li>{t("info_for_seller_list_1")}</li>
              <li>{t("info_for_seller_list_2")}</li>
              <li>{t("info_for_seller_list_3")}</li>
              <li>{t("info_for_seller_list_4")}</li>
            </ul> */}
          </div>

          <div id="category" className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{
              textDecoration: "underline"
            }}>{t("cost_by_category")}:</h4>
            <ForSellerTable />
          </div>

          <div id="start" className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{
              textDecoration: "underline"
            }}>{t("start_selling_title")}</h4>
            <p className={styles.textDesc} style={{ marginBottom: "10px" }}>
              {t("start_selling_desc")}:
            </p>

            <div className={styles.newTextWrap}>
              <h4>Account Registration </h4>
              <p>{t("start_selling_list_1")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Agreement to Terms and Policies </h4>
              <p>{t("start_selling_list_2")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Product Listings</h4>
              <p>{t("start_selling_list_3")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Policy Compliance </h4>
              <p>{t("start_selling_list_4")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Quality Standards</h4>
              <p>{t("start_selling_list_5")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Payment and Fees Agreement</h4>
              <p>{t("start_selling_list_6")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>Customer Service Commitment </h4>
              <p>{t("start_selling_list_7")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <p>If you have any questions or would like to speak with our team, please reach out.
                We look forward to welcoming you to Marketplace Reli and supporting your
                success in the global marketplace. </p>
            </div>

            {/* <ul className={styles.listDiv}>
              <li>{t("start_selling_list_1")}</li>
              <li>{t("start_selling_list_2")}</li>
              <li>{t("start_selling_list_3")}</li>
              <li>{t("start_selling_list_4")}</li>
              <li>{t("start_selling_list_5")}</li>
              <li>{t("start_selling_list_6")}</li>
              <li>{t("start_selling_list_7")}</li>
            </ul> */}
          </div>
        </div>
      </div>
    </Container >
  );
};

export default ForrSellerPage;
