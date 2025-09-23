import Container from "../../components/Container/Container"
import YellowBtn from "../../ui/yellowBtn/YellowBtn"
import DescText from "../../ui/general/descText/DescText"
import Steps from "../../components/sellingIsEasy/steps/Steps"

import bigImg from "../../assets/sellingIsEasy/bigImg.svg"

import styles from "./SellingIsEasy.module.scss"

const SellingIsEasy = () => {
    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <div className={styles.content}>
                        <div className={styles.textContent}>
                            <h1 className={styles.title}>Selling with Reli is easy</h1>
                            <DescText style={{ fontSize: "clamp(16px, 5vw, 20px)" }} text={"Just send us your product detail - we upload and promote them for you. "} />
                            <Steps />
                            <YellowBtn text={"Start Selling Today"} />
                        </div>

                        <img className={styles.img} src={bigImg} alt="" />


                    </div>
                </section>
            </Container>
        </div>
    )
}

export default SellingIsEasy