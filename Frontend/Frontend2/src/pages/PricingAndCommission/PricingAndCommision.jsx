import { useTranslation } from "react-i18next"

import Container from "../../components/Container/Container"
import FooterMain from "../../components/Footer/FooterMain/FooterMain"
import Header from "../../components/Header/Header"

import styles from "./PricingAndCommision.module.scss"
import ScrollToTop from "../../components/ScrollToTop/ScrollToTop"
import { useMediaQuery } from "react-responsive"
import CategoryAndRateTable from "../../components/CategoryAndRateTable/CategoryAndRateTable"

const PricingAndCommision = () => {

    const { t } = useTranslation("pricing")

    const isMobile = useMediaQuery({ maxWidth: 500 })

    return (
        <>
            <Header />
            <div className={styles.mainTitleWrap}>
                <h2>{t("mainTitle")}</h2>
                <p>{t("mainDesc")}</p>
            </div>
            <Container style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                paddingBlock: "80px"
            }}>
                <div className={styles.main}>
                    <section className={styles.policy}>

                        {/* Purpose block */}
                        <h2 className={styles.title}>{t("purposeBlock.title")}</h2>

                        <ol className={styles.list}>
                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</>}
                                {t("purposeBlock.list.list1")}
                            </li>
                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("purposeBlock.list.list2")}
                            </li>
                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("purposeBlock.list.list3")
                                }
                            </li>
                        </ol>

                        {/* Principles block */}

                        <h2 className={styles.title}>{t("principlesBlock.title")}</h2>

                        <ol className={styles.list}>
                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("principlesBlock.list.list1")}
                            </li>

                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("principlesBlock.list.list2")}
                                <ul className={styles.yellowList}>
                                    <li>{t("principlesBlock.yList1.list1")}</li>
                                    <li>{t("principlesBlock.yList1.list2")}</li>
                                    <li>{t("principlesBlock.yList1.list3")}</li>

                                </ul>
                            </li>

                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("principlesBlock.list.list3")}
                                <ul className={styles.yellowList}>
                                    <li>{t("principlesBlock.yList2.list1")}</li>
                                    <li>{t("principlesBlock.yList2.list2")}</li>
                                    <li>{t("principlesBlock.yList2.list3")}</li>
                                    <li>{t("principlesBlock.yList2.list4")}</li>
                                </ul>
                                <p>{t("principlesBlock.afterText")}</p>
                            </li>
                        </ol>

                        {/* rates block */}

                        <h2 className={styles.title}>Commission Rates by Category</h2>

                        <p className={styles.ratesDesc}>The following commission rates apply to sales completed on the Platform:</p>

                        <CategoryAndRateTable />


                        {/* Conditions block */}
                        <h2 className={styles.title}>{t("conditionsBlock.title")}</h2>
                        <ol className={styles.list}>
                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("conditionsBlock.list.list1")}
                            </li>
                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("conditionsBlock.list.list2")}
                            </li>
                        </ol>

                        {/* Changes block */}

                        <h2 className={styles.title}>{t("changesBlock.title")}</h2>


                        <ol className={styles.list}>
                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("changesBlock.list.list1")}
                                <ul className={styles.yellowList}>
                                    <li>
                                        {t("changesBlock.yList.list1")}
                                    </li>
                                    <li>
                                        {t("changesBlock.yList.list2")}
                                    </li>
                                    <li>
                                        {t("changesBlock.yList.list3")}
                                    </li>
                                </ul>
                            </li>
                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("changesBlock.list.list2")}
                            </li>
                        </ol>

                        {/*Transparency block  */}

                        <h2 className={styles.title}>{t("transparencyBlock.title")}</h2>

                        <ol className={styles.list}>
                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("transparencyBlock.list.list1")}
                            </li>
                            <li>
                                {isMobile && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;</>}
                                {t("transparencyBlock.list.list2")}
                            </li>
                        </ol>

                        {/* contact block */}

                        <div className={styles.contactBlock}>
                            <h2>7. {t("contactBlock.title")}</h2>
                            <p>{t("contactBlock.desc")}</p>
                            <a href="mailto:office@reli.one">office@reli.one</a>
                        </div>




                    </section>




                </div>



            </Container>
            <FooterMain />
            <ScrollToTop />
        </>
    )
}

export default PricingAndCommision