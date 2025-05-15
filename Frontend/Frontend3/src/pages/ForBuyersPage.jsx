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
              Marketplace Reli
            </h4>
            <p className={styles.textDesc}>
              At <span>Marketplace Reli</span>, we are committed to delivering a seamless, secure, and
              enriching platform that empowers both buyers and sellers to engage, transact, and
              flourish. Whether you are in search of unique, high-quality products, seeking
              exceptional value, or aiming to showcase your own offerings, we strive to make
              your experience outstanding at every touchpoint. </p>
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
              <span>Trust & Safety:</span>
              {t("what_sets_us_first")}
            </p>
            <p className={styles.textDesc} style={{ margin: "5px 0" }}>
              <span>Diverse Product Range:</span>
              {t("what_sets_us_second")}
            </p>
            <p className={styles.textDesc}>
              <span>Unparalleled Support:</span>
              {t("what_sets_us_third")}
            </p>
          </div>

          <div id="values" className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("our_values")}</h4>
            <p className={styles.textDesc}>
              <span>Integrity: </span>
              {t("our_values_first")}</p>
            <p className={styles.textDesc} >
              <span>Innovation: </span>
              {t("our_values_second")}
            </p>
            <p className={styles.textDesc}>
              <span>Community: </span>
              {t("our_values_third")}
            </p>
            <p className={styles.textDesc}>
              <span>Sustainability: </span>
              {t("our_values_4")}
            </p>
          </div>

          <div id="account" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>{t("account_information")}</h4>
            <p className={styles.textDesc}>{t("how_start_desc")}</p>

            <strong className={styles.textDesc} style={{ fontWeight: "700" }}>Steps to Create Your Account: </strong>

            <ol className={styles.newList}>
              <li>
                <span>Initiate Registration: </span> Click on the <span>“Sign Up”</span> or <span>“Register”</span> button on our
                homepage.
              </li>
              <li>
                <span>Enter Your Information: </span> Complete the registration form by providing your
                email address, desired username, and password. Additional details may be
                requested to better tailor our services to your preferences.
              </li>
              <li>
                <span>Verify Your Email Address: </span> After submission, you will receive a
                verification email. Follow the link to confirm your address and activate your
                account.
              </li>
              <li>
                <span>Complete Your Profile: </span> Finalize your registration by updating your profile
                for a customized experience.
              </li>
              <li>
                <span>Begin Exploring: </span>With your account activated, you are free to browse,
                shop, and enjoy all the benefits our marketplace offers.
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
                <span>Tailored Recommendations: </span>Receive personalized product suggestions
                based on your browsing and purchase history.
              </li>
              <li>
                <span>Expedited Checkout: </span>Save your shipping and payment information
                securely for a quicker checkout experience.
              </li>
              <li>
                <span>Order Management: </span>Monitor your order history and track deliveries
                effortlessly.
              </li>

            </ul>

          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("security_title")}</h4>
            <p className={styles.textDesc}>{t("security_desc")}</p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>Need Help? </h4>
            <p className={styles.textDesc}>For assistance during registration or any account-related concerns, our support
              team is readily available. Contact us at
              <a href="mailto:support600.reli@gmail.com" className={styles.emailText}>support600.reli@gmail.com</a>.
            </p>
          </div>

          <div id="purchase" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("make_purchase")}</h4>
            <p className={styles.textDesc}>{t("make_purchase_title")}</p>

            <ol className={styles.newList}>
              <li>
                <span>Explore Listings: </span>Use our search function or browse product categories to
                find items that interest you.
              </li>
              <li>
                <span>Review Item Details: </span>Click on a listing to see descriptions, images, and
                seller ratings. Evaluate carefully before proceeding.
              </li>
              <li>
                <span>Add to Cart & Review: </span>After selecting your desired items, review your
                cart. You may modify quantities, remove items, or apply promotional codes
                as needed.
              </li>
              <li>
                <span>Proceed to Checkout: </span>When ready, click the “Checkout” button to
                continue.
              </li>
              <li>
                <span>Input Shipping Information: </span>Provide accurate delivery details to ensure
                successful order fulfillment.
              </li>
              <li>
                <span>Select Payment Method: </span>Choose from our available secure payment
                options.
              </li>
              <li>
                <span>Finalize Your Order: </span>Follow the final prompts to confirm payment and
                complete the transaction. A confirmation email will follow.
              </li>
              <li>
                <span>Track Your Order: </span>Stay updated with real-time order tracking through
                your account or email notifications.
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
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>Need Support?</h4>
            <p className={styles.textDesc}>For purchasing inquiries or technical support, contact us at
              <a href="mailto:support600.reli@gmail.com" className={styles.emailText}>support600.reli@gmail.com</a>.
            </p>
          </div>

          <div id="delivery" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("delivery_options")}</h4>
            <p className={styles.textDesc}>{t("delivery_title")}</p>
            <p className={styles.textDesc}>
              <span>Courier Delivery: </span>
              {t("delivery_first_desc")}
            </p>
            <p className={styles.textDesc}>
              <span>Warehouse Pickup: </span>
              {t("delivery_second_desc")}
            </p>
            <p className={styles.textDesc}>
              <span>International Shipping: </span>
              {t("delivery_third_desc")}
            </p>
            <p className={styles.textDesc}>
              <span>Real-Time Tracking: </span>
              {t("delivery_fourth_desc")}
            </p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>Questions Regarding Shipping?</h4>
            <p className={styles.textDesc}>Reach out to our team at <a href="mailto:support600.reli@gmail.com" className={styles.emailText}>support600.reli@gmail.com</a> for assistance with delivery
              options or logistics.
            </p>
          </div>

          <div id="payment" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>{t("payment_options")}</h4>
            <p className={styles.textDesc}>{t("payment_title")}</p>
            <p className={styles.textDesc}>
              <span>Online Payment: </span>
              {t("payment_first_desc")}
            </p>
            <p className={styles.textDesc}>
              <span>Cash on Pickup: </span>Prefer in-person transactions? Choose the <span>Cash on
                Pickup</span> option and pay upon collection. Please note that cash is accepted in local
              currency only.
            </p>
            <p className={styles.textDesc}>
              <span>Secure Transactions: </span>
              {t("payment_third_desc")}
            </p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{ textDecoration: "underline" }}>Need Assistance with Payments?</h4>
            <p className={styles.textDesc}>If you need help choosing a payment method or experience any payment-related
              issues, contact us at<a href="mailto:support600.reli@gmail.com" className={styles.emailText}>support600.reli@gmail.com</a>
            </p>
          </div>

        </div>
      </div>
    </Container>
  );
};

export default ForBuyersPage;
