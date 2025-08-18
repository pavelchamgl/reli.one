import { useTranslation } from "react-i18next";
import { useState } from "react";

import Container from "../ui/Container/Container";

import styles from "../styles/RegRulesPage.module.scss";

const RegRulesPage = () => {
  const [section, setSection] = useState("weAre");

  const { t } = useTranslation();
  return (
    <Container>
      <div className={styles.main}>
        <p className={styles.title}>{t("complaintsProcedure")}</p>
        <div className={styles.container}>
          <div className={styles.linkDivForBuy}>
            <a
              style={{ color: section === "general" ? "#3f7f6d" : "#000" }}
              className={styles.linkItem}
              onClick={() => setSection("general")}
              href="#general"
            >
              1. {t("generalProvisions.title")}
            </a>
            <a
              style={{ color: section === "warranty" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("warranty")}
              className={styles.linkItem}
              href="#warranty"
            >
              2. {t("warrantyForQuality.title")}
            </a>
            <a
              className={styles.linkItem}
              href="#conditions"
              style={{ color: section === "conditions" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("conditions")}
            >
              3. {t("warrantyConditions.title")}
            </a>
            <a
              className={styles.linkItem}
              href="#handing"
              style={{ color: section === "handing" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("handing")}
            >
              4. {t("handlingComplaints.title")}
            </a>
            <a
              className={styles.linkItem}
              href="#provisions"
              style={{ color: section === "provisions" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("provisions")}
            >
              5. {t("generalProvisions.title")}
            </a>
            <a
              className={styles.linkItem}
              href="#min"
              style={{ color: section === "min" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("min")}
            >
              6. {t("consumablesAndLifespan.title")}
            </a>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} id="general">
              {t("generalProvisions.title")}
            </h4>
            <p className={styles.textDesc}>
              {t("generalProvisions.text1")}
              <br />
              <span>
                {t("generalProvisions.text2")}
              </span>
              <br />
              <span>
                {t("generalProvisions.text3")}
              </span>
              <br />
              <span>
                {t("generalProvisions.text4")}
              </span>
              <br />
              <span>
                {t("generalProvisions.text5")}
              </span>
            </p>
          </div>

          <div className={styles.paragDiv}>
            <h4 className={styles.textTitle} id="warranty">
              {t("warrantyForQuality.title")}
            </h4>
            <p className={styles.textDesc}>
              {t("warrantyForQuality.text1")}
              <br />
              <span>
                {t("warrantyForQuality.text2")}
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text3")}
              </span>
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyForQuality.text4")}
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text5")}
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text6_1")}
                <br />
                <ul>
                  <li>{t("warrantyForQuality.text6_2")}</li>
                  <li>
                    {t("warrantyForQuality.text6_3")}
                  </li>
                  <li>
                    {t("warrantyForQuality.text6_4")}
                  </li>
                  <li>
                    {t("warrantyForQuality.text6_5")}
                  </li>
                </ul>
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text7")}
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text8")}
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text9")}
              </span>
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyForQuality.text10")}
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text11")}
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text12")}
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text13_1")}

                <ul>
                  <li>
                    {t("warrantyForQuality.text13_2")}

                  </li>
                  <li> {t("warrantyForQuality.text13_3")}
                  </li>
                  <li>
                    {t("warrantyForQuality.text13_4")}
                  </li>
                  <li>
                    {t("warrantyForQuality.text13_5")}
                  </li>
                </ul>
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text14")}
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text15")}
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyForQuality.text16")}
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text17_1")}
                <ul>
                  <li>
                    {t("warrantyForQuality.text17_3")}
                  </li>
                  <li>
                    {t("warrantyForQuality.text17_4")}
                  </li>
                  <li>
                    {t("warrantyForQuality.text17_5")}
                  </li>
                  <li>
                    {t("warrantyForQuality.text17_6")}
                  </li>
                </ul>
              </span>
              <br />
              <span>
                {t("warrantyForQuality.text18")}
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyForQuality.text19")}
              </span>
              <span>
                {t("warrantyForQuality.text20")}
              </span>
            </p>
          </div>

          <div id="conditions" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("warrantyConditions.title")}:</h4>
            <p className={styles.textDesc}>
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyConditions.text1")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text2")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text3")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text4")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text5")}
                <a
                  style={{
                    color: "#047857",
                    textDecoration: "none",
                    padding: "0 5px",
                  }}
                  href="#"
                >
                  {t("warrantyConditions.pochta")}
                </a>
                {t("warrantyConditions.text5_1")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text6")}
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyConditions.text7")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text8")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text9")}
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyConditions.text10")}
              </span>
              <span>
                {t("warrantyConditions.text11")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text12")}
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyConditions.text13")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text14")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text15")}
              </span>
              <ul>
                <li>{t("warrantyConditions.text16")}</li>
                <li>
                  {t("warrantyConditions.text17")}
                </li>
                <li>
                  {t("warrantyConditions.text18")}
                </li>
                <li>
                  {t("warrantyConditions.text19")}
                </li>
                <li>
                  {t("warrantyConditions.text20")}
                </li>
                <li>
                  {t("warrantyConditions.text21")}
                </li>
                <li>
                  {t("warrantyConditions.text22")}
                </li>
                <li>
                  {t("warrantyConditions.text23")}
                </li>
                <li>
                  {t("warrantyConditions.text24")}
                </li>
                <li>{t("warrantyConditions.text25")}</li>
                <li>{t("warrantyConditions.text26")}</li>
                <li>{t("warrantyConditions.text27")}</li>
                <li>
                  {t("warrantyConditions.text28")}
                </li>
              </ul>
              <span>
                {t("warrantyConditions.text29")}
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyConditions.text30")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text31")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text32")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text33")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text34")}
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyConditions.text35")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text36")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text37")}
              </span>
              <br />
              <span>
                {t("warrantyConditions.text38")}
              </span>
              <br />
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyConditions.text39")}
              </span>
              <br />
              <span>{t("warrantyConditions.text40")}</span>
              <br />
              <span style={{ margin: "20px 0" }}>
                {t("warrantyConditions.text41")}
              </span>
              <span>{t("warrantyConditions.text42")}</span>
              <br />
              <span style={{ margin: "20px 0" }}>
                {t("warrantyConditions.text43")}
              </span>
              <span>
                {t("warrantyConditions.text44")}
              </span>
              <span style={{ fontWeight: "400", margin: "15px" }}>
                {t("warrantyConditions.text45")}
              </span>
              <span>
                {t("warrantyConditions.text46")}
              </span>
              <span>
                {t("warrantyConditions.text47")}
              </span>
              <span>
                {t("warrantyConditions.text48")}
              </span>
              <span>
                {t("warrantyConditions.text49")}
                <ul>
                  <li>
                    {t("warrantyConditions.text50")}
                  </li>
                  <li>
                    {t("warrantyConditions.text51")}
                  </li>
                </ul>
              </span>
            </p>
          </div>

          <div id="handing" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("handlingComplaints.title")}</h4>
            <p className={styles.textDesc}>
              <span>
                {t("handlingComplaints.text2")}
              </span>
              <span>
                {t("handlingComplaints.text3")}
              </span>
            </p>
          </div>

          <div id="provisions" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>{t("generalProvisions.title")}</h4>
            <p className={styles.textDesc}>
              <span>
                {t("generalProvisions2.text2")}
              </span>
              <span>
                {t("generalProvisions2.text3")}
              </span>
              <span>
                {t("generalProvisions2.text4")}
              </span>
              <span>
                {t("generalProvisions2.text5")}
              </span>
              <span>
                {t("generalProvisions2.text6")}
              </span>
              <span>
                {t("generalProvisions2.text7")}
              </span>
              <span>
                {t("generalProvisions2.text8")}
              </span>
              <span>
                {t("generalProvisions2.text9")}
              </span>
              <span>
                {t("generalProvisions2.text10")}
              </span>
              <span>
                {t("generalProvisions2.text11")}
              </span>
            </p>
          </div>

          <div id="min" className={styles.accountInfoDiv}>
            <h4 className={styles.textTitle}>
              {t("consumablesAndLifespan.title")}
            </h4>
            <p className={styles.textDesc}>
              <span>
                {t("consumablesAndLifespan.text2")}
              </span>
              <span>
                {t("consumablesAndLifespan.text3")}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default RegRulesPage;
