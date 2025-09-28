import { useState } from "react";
import { useTranslation } from "react-i18next";

import Container from "../ui/Container/Container";
import ForSellerTable from "../ui/ForSellerTable/ForSellerTable";

import styles from "../styles/ForSellerPage.module.scss";

const ForrSellerPage = () => {
  const [section, setSection] = useState("market");

  const { t } = useTranslation();

  const prodNameDesc = [
    t("product_name_and_desc.text1"),
    t("product_name_and_desc.text2"),
    t("product_name_and_desc.text3"),
    t("product_name_and_desc.text4"),
    t("product_name_and_desc.text5"),
  ]

  const imagesRules = [
    t("images_rules.text1"),
    t("images_rules.text2"),
    t("images_rules.text3"),
    t("images_rules.text4"),
    t("images_rules.text5"),
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
              3.  {t("start_selling_title")}
            </a>
          </div>

          <div id="market" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("who_we_are")}</h4>
            <p className={styles.textDesc}>
              {t("mission_statement.at")} <span>{t("mission_statement.marketplace")}</span>
              {t("mission_statement.other_text")}
            </p>
          </div>

          <div id="choose" className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{
              textDecoration: "underline"
            }}>{t("why_choose_title")}</h4>


            <div className={styles.newTextWrap}>
              <h4>{t("european_reach_title")}</h4>
              <p>{t("why_choose_list_1")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("empower_business_title")}</h4>
              <p>{t("why_choose_list_2")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("fair_fees_title")}</h4>
              <p>{t("why_choose_list_3")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("promote_brand_title")}</h4>
              <p>{t("why_choose_list_4")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("reduced_costs_title")}</h4>
              <p>{t("why_choose_list_5")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("customer_feedback_title")}</h4>
              <p>{t("why_choose_list_6")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("secure_transactions_title")}</h4>
              <p>{t("why_choose_list_7")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("support_team_title")}</h4>
              <p>{t("why_choose_list_8")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("competitive_advantage_title")}</h4>
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
              <h4>{t("info_for_seller.product_category")}</h4>
              <p>{t("info_for_seller_list_1")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("info_for_seller.sales_volume")}</h4>
              <p>{t("info_for_seller_list_2")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("info_for_seller.value_added_services")}</h4>
              <p>{t("info_for_seller_list_3")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4>{t("info_for_seller.promotional_discounts")}</h4>
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
            <p className={styles.afterTableText}>{t("after_table_text")}</p>
          </div>

          <div id="start" className={styles.paragDiv}>
            <h4 className={styles.textTitle} style={{
              textDecoration: "underline"
            }}>{t("start_selling_title")}</h4>
            <p className={styles.textDesc} style={{ marginBottom: "10px" }}>
              {t("start_selling_desc")}
            </p>
            <p className={styles.textDesc} style={{ marginTop: "20px" }}>{t("onboarding_preparation_notice")}</p>

            <h4 className={styles.textTitle} style={{
              textDecoration: "underline",
              margin: "30px 0"
            }}>{t("marketplace_listing_required_info")}</h4>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>{t("product_name_and_desc.title")}</h4>
              <ul>
                {
                  prodNameDesc.map((text) => (
                    <li>{text}</li>
                  ))
                }
              </ul>
              <p style={{ margin: "20px 0", fontStyle: "italic" }}>{t("language_requirement.title")}</p>
              <ul>
                <li>{t("language_requirement.text1")}</li>
                <li>{t("language_requirement.text2")}</li>
              </ul>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>{t("images_rules.title")}</h4>
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
              }}>{t("vat_percentage.title")}</h4>
              <p>{t("vat_percentage.text")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>{t("product_dimensions_and_weight.title")}</h4>
              <p>{t("product_dimensions_and_weight.text1")}</p>
              <ul style={{ margin: "20px 0" }}>
                <li>{t("product_dimensions_and_weight.list1")}</li>
                <li>{t("product_dimensions_and_weight.list2")}</li>
              </ul>
              <p>{t("product_dimensions_and_weight.text2")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>{t("deadline_for_submitting_product_info.title")}</h4>
              <p>{t("deadline_for_submitting_product_info.text")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>{t("step_2_agreement_signing.title")}</h4>
              <p>{t("step_2_agreement_signing.text")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>{t("step_3_final_approval_and_listing.title")}</h4>
              <p>{t("step_3_final_approval_and_listing.text")}</p>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>{t("if_you_get_the_order.title")}</h4>
              <div className={styles.getOrderWrap}>
                <p>{t("if_you_get_the_order.step1_title")}</p>
                <p>{t("if_you_get_the_order.step1_text")}</p>
                <p>{t("if_you_get_the_order.step2_title")}</p>
                <p>{t("if_you_get_the_order.step2_text")}</p>
                <p>{t("if_you_get_the_order.step3_title")}</p>
                <p>{t("if_you_get_the_order.step3_text")}</p>
                <p>{t("if_you_get_the_order.step4_title")}</p>
                <p>{t("if_you_get_the_order.step4_text")}</p>
              </div>
            </div>

            <div className={styles.newTextWrap}>
              <h4 className={styles.textTitle} style={{
                textDecoration: "underline"
              }}>{t("communication_policy.title")}</h4>
              <p>{t("communication_policy.text1")}</p>
              <ul>
                <li>{t("communication_policy.list1")} <a target="_blank" href="mailto:office@reli.one" className={styles.emailText}>{t("communication_policy.list1_email")}</a></li>
                <li>{t("communication_policy.list2")}</li>
                <li>{t("communication_policy.list3")}</li>
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
