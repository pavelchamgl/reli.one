import { useTranslation } from "react-i18next"

import Container from "../../components/Container/Container"
import YellowBtn from "../../ui/yellowBtn/YellowBtn"
import DescText from "../../ui/general/descText/DescText"
import Steps from "../../components/sellingIsEasy/steps/Steps"

import bigImg from "../../assets/sellingIsEasy/bigImg.svg"

import styles from "./SellingIsEasy.module.scss"

const SellingIsEasy = () => {

    const { t } = useTranslation("blocks")

    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <div className={styles.content}>
                        <div className={styles.textContent}>
                            <h1 className={styles.title}>{t("selling.title")}</h1>
                            <DescText style={{ fontSize: "clamp(16px, 5vw, 20px)" }} text={t("selling.description")} />
                            <Steps />
                            <div className={styles.btnWrap}>
                                <YellowBtn text={t("selling.button_start")} url={"https://reli.one/seller/login"} />
                                <YellowBtn text={t("selling.button_goto")} arr={true} style={{
                                    background: "#eef0f2"
                                }} url="https://reli.one/" />

                            </div>
                        </div>

                        <img className={styles.img} src={bigImg} alt="" />


                    </div>
                </section>
            </Container>
        </div>
    )
}

export default SellingIsEasy