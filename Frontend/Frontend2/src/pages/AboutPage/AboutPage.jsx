import Header from '../../components/Header/Header'
import Container from '../../components/Container/Container'
import FooterMain from '../../components/Footer/FooterMain/FooterMain'
import ScrollToTop from '../../components/ScrollToTop/ScrollToTop'


import styles from "./AboutPage.module.scss"
import { useTranslation } from 'react-i18next'

const AboutPage = () => {

    const { t } = useTranslation("about")

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
                    {/* corporate block */}
                    <div className={styles.block}>
                        <h3>{t("corporateBlock.title")}</h3>
                        <p>{t("corporateBlock.text1")}</p>
                        <p>{t("corporateBlock.text2")}</p>
                        <p>{t("corporateBlock.text3")}</p>
                        <ul className={styles.yellowList}>
                            <li>{t("corporateBlock.list.list1")}</li>
                            <li>{t("corporateBlock.list.list2")}</li>
                            <li>{t("corporateBlock.list.list3")}</li>
                            <li>{t("corporateBlock.list.list4")}</li>
                            <li>{t("corporateBlock.list.list5")}</li>
                        </ul>
                        <p>{t("corporateBlock.text4")}</p>
                    </div>

                    {/* strategic block */}

                    <div className={styles.block}>
                        <h3>{t("strategicBlock.title")}</h3>
                        <p>{t("strategicBlock.text1")}</p>
                        <p>{t("strategicBlock.text2")}</p>
                        <p>{t("strategicBlock.text3")}</p>
                        <ul className={styles.yellowList}>
                            <li>{t("strategicBlock.list.list1")}</li>
                            <li>{t("strategicBlock.list.list2")}</li>
                            <li>{t("strategicBlock.list.list3")}</li>
                        </ul>
                        <p>{t("strategicBlock.text4")}</p>
                    </div>

                    {/* adavantage block */}

                    <div className={styles.block}>
                        <h3>{t("adavantageBlock.title")}</h3>
                        <p>{t("adavantageBlock.text1")}</p>

                        <div className={styles.advantageBlocksWrap}>
                            <div className={styles.advantageBlock}>
                                <h4>{t("adavantageBlock.blocks.block1.title")}</h4>
                                <p>{t("adavantageBlock.blocks.block1.desc")}</p>
                            </div>

                            <div className={styles.advantageBlock}>
                                <h4>{t("adavantageBlock.blocks.block2.title")}</h4>
                                <p>{t("adavantageBlock.blocks.block2.desc")}</p>
                            </div>
                            <div className={styles.advantageBlock}>
                                <h4>{t("adavantageBlock.blocks.block3.title")}</h4>
                                <p>{t("adavantageBlock.blocks.block3.desc")}</p>
                            </div>
                            <div className={styles.advantageBlock}>
                                <h4>{t("adavantageBlock.blocks.block4.title")}</h4>
                                <p>{t("adavantageBlock.blocks.block4.desc")}</p>
                            </div>


                        </div>
                    </div>


                    {/* value block */}
                    <div className={styles.block}>
                        <h3>{t("valueBlock.title")}</h3>
                        <p>{t("valueBlock.text1")}</p>
                        <ul className={styles.yellowList}>
                            <li>{t("valueBlock.list.list1")}</li>
                            <li>{t("valueBlock.list.list2")}</li>
                            <li>{t("valueBlock.list.list3")}</li>
                            <li>{t("valueBlock.list.list4")}</li>
                        </ul>
                        <p>{t("valueBlock.text2")}</p>
                    </div>

                    {/* vision block */}

                    <div className={styles.block}>
                        <h3>{t("visionBlock.title")}</h3>
                        <p>{t("visionBlock.text1")}</p>
                        <p>{t("visionBlock.text2")}</p>
                    </div>

                    {/* realexp block */}

                    <div className={styles.realExpBlock}>
                        <h3>{t("reslexpBlock.title")}</h3>
                        <p>{t("reslexpBlock.text1")}</p>
                        <p>{t("reslexpBlock.text2")}</p>
                        <p>{t("reslexpBlock.text3")}</p>
                    </div>

                </div>



            </Container>
            <FooterMain />
            <ScrollToTop />
        </>
    )
}

export default AboutPage