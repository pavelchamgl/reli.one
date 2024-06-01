import { useState } from "react";
import Container from "../ui/Container/Container";

import styles from "../styles/ForSellerPage.module.scss";
import ForSellerTable from "../ui/ForSellerTable/ForSellerTable";

const ForrSellerPage = () => {
  const [section, setSection] = useState("market");

  return (
    <Container>
      <div className={styles.main}>
        <p className={styles.title}>Pro prodejce</p>

        <div className={styles.container}>
          <div className={styles.linkDiv}>
            <a
              className={styles.linkItem}
              href="#market"
              style={{ color: section === "market" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("market")}
            >
              1.  Marketplace Reli, who we are
            </a>
            <a
              className={styles.linkItem}
              href="#choose"
              style={{ color: section === "choose" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("choose")}
            >
              1.1.  Why to choose us
            </a>
            <a
              className={styles.linkItem}
              href="#info"
              style={{ color: section === "info" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("info")}
            >
              2.  Fees information for sellers
            </a>
            <a
              className={styles.linkItem}
              href="#category"
              style={{ color: section === "category" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("category")}
            >
              2.2 Fees according to the category
            </a>
            <a
              className={styles.linkItem}
              href="#start"
              style={{ color: section === "start" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("start")}
            >
              3.  To start sellingon marketplace Reli
            </a>
          </div>

          <div id="market" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>Who We Are</h4>
            <p className={styles.textDesc}>
              At Reli Marketplace, we are dedicated to providing a seamless and
              secure platform for buyers and sellers to connect, transact, and
              thrive. Whether you are looking for unique products, seeking great
              deals, or looking to showcase your own offerings, we are here to
              make your experience exceptional. Marketplace Reli is more than
              just a marketplace – we are a passionate team of innovators, tech
              enthusiasts, and customer advocates. Our diverse team is dedicated
              to creating a trusted, transparent, and user-friendly environment
              for all participants.
            </p>
          </div>

          <div id="choose" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>Why to choose us?</h4>
            <ul className={styles.listDiv}>
              <li>
                EUROPEAN REACH, GLOBAL IMPACT: with our expansive network of
                buyers and sellers across Europe and beyond, marketplace Reli
                offers unparalleled reach and exposure for your products and
                services.
              </li>
              <li>
                EMPOWER YOUR BUSINESS: our platform provides the sellers with
                the tools, resources, and support you need to thrive.
              </li>
              <li>
                FAIR AND TRANSPARENT FEES: our straightforward fee structure
                ensures that you pay for the services you use.
              </li>
              <li>
                PROMOTE YOUR BRAND: being a seller on our marketplace means to
                get powerful promotional features, from featured listings to
                targeted advertising campaigns that will help you to increase
                visibility, attract more customers, and drive sales.
              </li>
              <li>
                REDUCED MARKETING COSTS: selling on our marketplace can be more
                cost-effective than traditional marketing channels, marketplace
                handles much of the marketing and promotion.
              </li>
              <li>
                CUSTOMER FEEDBACK AND REVIEWS: our marketplace allows sellers to
                receive direct feedback from customers through product review
                and ratings. This feedback can be invaluable for improving
                product quality, addressing customer concerns, and enhancing the
                overall customer experience.
              </li>
              <li>
                SECURE TRANSACTIONS: all the transactions on marketplace Reli
                are safe and secured with trusted payment processing system.
              </li>
              <li>
                DEDICATED SUPPORT TEAM: in case any you have any questions or
                assistance, our dedicated support team is ready to help you,
                from onboarding assistance to ongoing support.
              </li>
              <li>
                COMPETITIVE ADVANTAGE: by selling on our marketplace, you will
                gain a competitive advantage over competitors. You can
                differentiate your products, offer competitive prices, and
                capitalize on emerging market trends.
              </li>
            </ul>
          </div>

          <div id="info" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>Fees information for sellers</h4>
            <p className={styles.textDesc} style={{ marginBottom: "10px" }}>
              The fees for selling on our marketplace can depend on several
              factors, including:
            </p>
            <ul className={styles.listDiv}>
              <li>
                PRODUCT CATEGORY: fees may vary depending on the category of
                products being sold. Also these fees can differ if certain
                category of product requires specialized handling, storage, or
                fulfillment services.
              </li>
              <li>
                TRANSACTION VOLUME: our marketplace offer tiered pricing based
                on the volume of sales or the number of listings a seller has on
                the platform. Sellers who generate higher sales volumes may
                qualify for lower fees or discounted rates.
              </li>
              <li>
                VALUE – ADDED SERVICES: our marketplace offers additional
                services or features to sellers for an additional fee. These
                services could include premium placement in search results,
                advertising opportunities, fulfillment services, etc.
              </li>
              <li>
                PROMOTIONAL CAMPAIGNS AND DISCOUNTS: our marketplace can also
                run promotional campaigns or offer discounts on fees for sellers
                during certain periods or events.
              </li>
            </ul>
          </div>

          <div id="category" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>
              Fees according to the category:
            </h4>
            <ForSellerTable />
          </div>

          <div id="start" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>
              To start selling on marketplace Reli
            </h4>
            <p className={styles.textDesc} style={{ marginBottom: "10px" }}>
              We as an online platform have some requirements and conditions
              that you as a seller need to meet:
            </p>
            <ul className={styles.listDiv}>
              <li>
                ACCOUNT / REGISTRATION: you need to register on our platform.
                This involves providing basic information about your business,
                such as name, address, contact details, and tax identification
                number.
              </li>
              <li>
                AGREE TO TERMS AND CONDITIONS: all the sellers are required to
                agree to marketplace’s terms and conditions, seller policies,
                and user agreements before starting to sell. These documents
                outline the rules, rights, and responsibilities of sellers on
                the platform.
              </li>
              <li>
                PRODUCT LISTINGS: you need to create accurate and detailed
                listings of your products on our marketplace. This includes
                providing product descriptions, images, pricing information, and
                other relevant details to help customers make informed
                purchasing decisions.
              </li>
              <li>
                COMPLIANCE WITH POLICIES: sellers must comply with the
                marketplace’s policies and guidelines regarding product
                listings, prohibited items, intellectual property rights,
                shipping and fulfillment, customer service, and other aspects of
                selling on our platform.
              </li>
              <li>
                QUALITY STANDARDS: our marketplace has quality standards and
                requirements, so all the sellers have to ensure the quality and
                authenticity of their products. This normally includes standards
                for product condition, packaging, labeling, and customer
                satisfaction.
              </li>
              <li>
                PAYMENT AND FEES: all the sellers are required to agree to the
                marketplace’s fee structure. This includes fee options
                associated with selling on the platform, such a listing fees,
                transaction fees, and subscription fees.
              </li>
              <li>
                CUSTOMER SERVISE: all the sellers of our marketplace are
                expected to provide responsive and reliable customer service to
                address customer inquiries, resolve issues, and ensure a
                positive buying experience. This involves responding to messages
                promptly, processing returns and refunds, and handling disputes
                professionally.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ForrSellerPage;
