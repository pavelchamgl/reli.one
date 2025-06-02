import newImage from '../assets/newImage.svg';
import emailIcon from '../assets/email_icon.png';
import phoneIcon from '../assets/phone_icon.png';
import addressIcon from '../assets/adress_icon.png';

import styles from "../css/Kontakt.module.css"
import { useTranslation } from 'react-i18next';

const YellowStick = ({ height = "", width = "" }) => {
    return (
        <div style={{ width: width, height: height }} className={styles.stick}></div>
    )
}

const NewKontakt = () => {

    const { t } = useTranslation()

    return (
        <div className={styles.main}>
            <p className="py-12 text-5xl font-bold">{t("contact")}</p>


            <div>
                <div className={styles.firstWrap}>
                    <img className={styles.bigImg} src={newImage} alt="" />
                    <YellowStick width='18px' height='250px' />
                    <div className={styles.emailSection}>
                        <img src={emailIcon} alt="Email" className="w-12" />
                        <p className="text-xl font-bold xl:text-3xl">Email</p>
                        <p className="xl:text-xl">info@reli.one</p>
                    </div>
                </div>
                <div className={styles.secWrap}>
                    <div className={styles.middleSticks}></div>
                    <div className={styles.yellowCircle}></div>
                    <div className={styles.middleSticks}></div>
                </div>
                <div className={styles.thirdWrap}>
                    <div className={styles.phoneWrap}>
                        <p className="text-lg font-bold">Number:</p>
                        <div className={styles.phoneBlock}>
                            <img className='w-10 h-10 mr-4' src={phoneIcon} alt="Phone" />
                            <p className="font-medium">+420 797 837 856</p>
                        </div>
                    </div>

                    <YellowStick width='18px' height='132px' />

                    <div className={styles.adressBlock}>
                        <div>
                            <p className="text-xl font-bold mb-3">Address:</p>
                            <div className={styles.adressImgText}>
                                <img src={addressIcon} className="w-10" alt="Address" />
                                <p className="xl:text-lg">
                                    Na Lysinách 551/34, Praha 4 - Hodkovičky, PSČ 147 00
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default NewKontakt