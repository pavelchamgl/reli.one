import { useState } from "react";
import { useTranslation } from "react-i18next";

import Container from "../ui/Container/Container";
import ForSellerTable from "../ui/ForSellerTable/ForSellerTable";

import styles from "../styles/ForSellerPage.module.scss";

const ForrSellerPage = () => {
  const [section, setSection] = useState("market");

  const { t } = useTranslation();

  const prodNameDesc = [
    "Product name",
    "SKU (unique code)",
    "Product category",
    "Short description (up to 500 characters)",
    "Full description (up to 2000 characters, with advantages and features)"
  ]

  const imagesRules = [
    "Format: JPG or PNG",
    "Minimum resolution: 708 x 708 pixels, RECOMMENDED 1024 x 1024 pixels",
    "Images must be clear, sharp, well-lit, and free from watermarks, logos, or text overlays",
    "The product should occupy at least 80% of the image frame",
    "Include at least 1 main image (up to 5 additional ones from different angles or in use)"
  ]

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
              3. To start sellingon marketplace Reli
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
            }}>{t("cost_by_category")}</h4>
            <ForSellerTable />
            <p className={styles.afterTableText}>Reli Group s.r.o. applies a standard acquiring fee, which covers the cost of payment processing.
              Additional marketplace commission is applied depending on category or promotion agreements.</p>
          </div>

          <div id="start" className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{
              textDecoration: "underline"
            }}>{t("start_selling_title")}</h4>
            <p className={styles.textDesc} style={{ marginBottom: "10px" }}>
              {t("start_selling_desc")}
            </p>
            <p className={styles.textDesc} style={{ marginTop: "20px" }}>PLEASE PREPARE ALL REQUIRED PRODUCT INFORMATION BEFORE THE ONBOARDING EMAIL
              EXCHANGE TO SPEED UP THE PROCESS.</p>

            <h4 className={styles.textTitle} style={{
              textDecoration: "underline",
              margin: "30px 0"
            }}>REQUIRED INFORMATION FOR MARKETPLACE LISTING:</h4>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>Product Name and Description</h4>
              <ul>
                {
                  prodNameDesc.map((text) => (
                    <li>{text}</li>
                  ))
                }
              </ul>
              <p style={{ margin: "20px 0", fontStyle: "italic" }}>Language Requirement!</p>
              <ul>
                <li>All information must be provided in English</li>
                <li>Providing the same information in Czech is highly encouraged and helps speed up the
                  approval and listing process</li>
              </ul>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>Images</h4>
              <ul>
                {
                  imagesRules.map((text) => (
                    <li>{text}</li>
                  ))
                }
              </ul>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>VAT Percentage</h4>
              <p>The applicable Value Added Tax (VAT) rate for each product, based on your local legislations or
                country of sale</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>Product Dimensions and Weight</h4>
              <p>Provide accurate measurements in the following format:</p>
              <ul style={{ margin: "20px 0" }}>
                <li>Length x Width x Height (in cm), (L x W x H – in this exact order)</li>
                <li>Weight (in kg)</li>
              </ul>
              <p>MISSING OR INACCURATE DIMENSIONS CAN RESULT IN SHIPPING ERRORS,
                INCORECT DELIVERY PRICING, AND DELAYS</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>DEADLINE FOR SUBMITTING PRODUCT INFORMATION</h4>
              <p>You must submit all required product information within 30 days from the initial
                onboarding contact. </p>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>STEP 2: Agreement Signing</h4>
              <p>You have 30 calendar days to confirm and sign the cooperation agreement. If the
                agreement is not signed in time, onboarding will be paused. </p>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>STEP 3: Final Approval and Product Listing</h4>
              <p>Once all product data is delivered and approved, Reli Group s.r.o. will publish the
                products on the marketplace. Your assigned manager will support you throughout
                the process. </p>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>IF YOU GET THE ORDER</h4>
              <div className={styles.getOrderWrap}>
                <p>1. Order Confirmation</p>
                <p>You must confirm each new order within 24 hours (business days only).</p>
                <p>2. Packing the Order</p>
                <p>You are responsible for packing the order yourself, including.</p>
                <p>3. Shipping Deadline</p>
                <p>The order must be shipped our within 3 business days after confirmation.</p>
                <p>4. Shipping Method</p>
                <p>The parcel must be handed over to the agreed transport company which is
                  chosen by a buyer. </p>
              </div>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>Communication Policy</h4>
              <p>To avoid delays and ensure clear communication, please note:</p>
              <ul>
                <li>All communication must go through email: <a target="_blank" href="mailto:office@reli.one" className={styles.emailText}>office@reli.one</a></li>
                <li>If you have questions, consult this document first, it was designed to
                  answer most common issues and reduce back-and-forth</li>
                <li>Repeated or avoidable questions slow down the onboarding process for
                  everyone. Please follow the steps and formats described here carefully.</li>
              </ul>
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
