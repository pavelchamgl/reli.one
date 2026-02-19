import { useTranslation } from 'react-i18next'

import Container from '../ui/Container/Container'

import styles from "../styles/TermsPage.module.scss"
import renderI18nRichText from '../Components/renderI18nRichText/RenderI18nRichText'

const TermsPage = () => {

    const { t } = useTranslation('terms')

    return (
        <>
            <div className={styles.titleWrap}>
                <h1>{t("title")}</h1>
            </div>
            <Container>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("intro.title")}</h4>
                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`intro.part1`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>



                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("supplier.mainTitle")}</h4>
                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`supplier.title1`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>
                    {
                        ['a) ', 'b) ', 'c) ', 'd) ', 'e) ', 'f) ', 'g) '].map((item, index) => {
                            return (
                                <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                                    <span>{item}</span>
                                    {renderI18nRichText({
                                        text: t(`supplier.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }
                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`supplier.title2`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>



                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("terms.title")}</h4>
                    {
                        [...Array(8)].map((item, index) => {
                            return (
                                <p className={`${styles.textDesc} ${styles.margB}`}>
                                    <span>{item}</span>
                                    {renderI18nRichText({
                                        text: t(`terms.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }
                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("delivery.title")}</h4>
                    {
                        [...Array(11)].map((item, index) => {
                            return (
                                <p className={`${styles.textDesc} ${styles.margB}`}>
                                    <span>{item}</span>
                                    {renderI18nRichText({
                                        text: t(`delivery.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }
                </div>


                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("accounting.title")}</h4>
                    {
                        [...Array(15)].map((item, index) => {
                            return (
                                <p className={`${styles.textDesc} ${styles.margB}`}>
                                    <span>{item}</span>
                                    {renderI18nRichText({
                                        text: t(`accounting.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }
                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("fees.title")}</h4>
                    {
                        [...Array(6)].map((item, index) => {
                            return (
                                <p className={`${styles.textDesc} ${styles.margB}`}>
                                    <span>{item}</span>
                                    {renderI18nRichText({
                                        text: t(`fees.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }
                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("waranty.title")}</h4>
                    {
                        [...Array(9)].map((item, index) => {
                            return (
                                <p className={`${styles.textDesc} ${styles.margB}`}>
                                    <span>{item}</span>
                                    {renderI18nRichText({
                                        text: t(`waranty.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }


                    <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                        <span>{"a) "}</span>
                        {renderI18nRichText({
                            text: t(`waranty.part9List1`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>
                    <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                        <span>{"b) "}</span>
                        {renderI18nRichText({
                            text: t(`waranty.part9List2`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>

                    {
                        [10, 11, 12, 13, 14, 15].map((item, index) => {
                            return (
                                <p className={`${styles.textDesc} ${styles.margB}`}>

                                    {renderI18nRichText({
                                        text: t(`waranty.part${item}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }

                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("termination.title")}</h4>
                    {
                        [...Array(3)].map((item, index) => {
                            return (
                                <p className={`${styles.textDesc} ${styles.margB}`}>
                                    <span>{item}</span>
                                    {renderI18nRichText({
                                        text: t(`termination.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }


                    <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                        <span>{"a) "}</span>
                        {renderI18nRichText({
                            text: t(`termination.part3List1`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>
                    <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                        <span>{"b) "}</span>
                        {renderI18nRichText({
                            text: t(`termination.part3List2`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>
                    <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                        <span>{"c) "}</span>
                        {renderI18nRichText({
                            text: t(`termination.part3List3`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>
                    <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                        <span>{"d) "}</span>
                        {renderI18nRichText({
                            text: t(`termination.part3List4`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>

                    {
                        [4, 5, 6, 7, 8].map((item, index) => {
                            return (
                                <p className={`${styles.textDesc} ${styles.margB}`}>

                                    {renderI18nRichText({
                                        text: t(`termination.part${item}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }

                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("confidentiality.title")}</h4>

                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`confidentiality.part1`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>

                    <>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`confidentiality.part2.title`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>a) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part2.list1`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>b) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part2.list2`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>c) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part2.list3`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                    </>

                    <>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`confidentiality.part3.title`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>a) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part3.list1`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>b) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part3.list2`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>c) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part3.list3`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                    </>

                    <>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`confidentiality.part4.title`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>a) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part4.list1`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>b) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part4.list2`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>c) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part4.list3`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>d) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part4.list4`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>e) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part4.list5`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                    </>

                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`confidentiality.part5`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>
                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`confidentiality.part6`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>
                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`confidentiality.part7`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>

                    <>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`confidentiality.part8.title`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>a) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part8.list1`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>b) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part8.list2`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>c) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part8.list3`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>d) </span>
                            {renderI18nRichText({
                                text: t(`confidentiality.part8.list4`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                    </>

                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`confidentiality.part9`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>
                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`confidentiality.part10`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>

                </div>

                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("intellectual.title")}</h4>

                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`intellectual.part1`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>
                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`intellectual.part2`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>

                    <>
                        <p className={`${styles.textDesc} ${styles.margB}`}>
                            {renderI18nRichText({
                                text: t(`intellectual.part3.title`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>a) </span>
                            {renderI18nRichText({
                                text: t(`intellectual.part3.list1`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>b) </span>
                            {renderI18nRichText({
                                text: t(`intellectual.part3.list2`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                        <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                            <span>c) </span>
                            {renderI18nRichText({
                                text: t(`intellectual.part3.list3`),
                                numberClassName: styles.num,
                                linkClassName: styles.emailText,
                                headingNumberClassName: styles.headNum
                            })}
                        </p>
                    </>

                    <p className={`${styles.textDesc} ${styles.margB}`}>
                        {renderI18nRichText({
                            text: t(`intellectual.part4`),
                            numberClassName: styles.num,
                            linkClassName: styles.emailText,
                            headingNumberClassName: styles.headNum
                        })}
                    </p>

                </div>

                <div className={`${styles.textBlock} ${styles.commonBlock}`}>
                    <h4 className={styles.textTitle}>
                        {t("contractual.title")}</h4>

                    {
                        [...Array(6)].map((item, index) => {
                            return (
                                <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                                    {renderI18nRichText({
                                        text: t(`contractual.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }

                </div>

                <div className={`${styles.textBlock} `}>
                    <h4 className={styles.textTitle}>
                        {t("liability.title")}</h4>

                    {
                        [...Array(4)].map((item, index) => {
                            return (
                                <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                                    {renderI18nRichText({
                                        text: t(`liability.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }

                </div>

                <div className={`${styles.textBlock} `}>
                    <h4 className={styles.textTitle}>
                        {t("conditions.title")}</h4>

                    {
                        [...Array(5)].map((item, index) => {
                            return (
                                <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                                    {renderI18nRichText({
                                        text: t(`conditions.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }

                </div>

                <div className={`${styles.textBlock} `}>
                    <h4 className={styles.textTitle}>
                        {t("final.title")}</h4>

                    {
                        [...Array(6)].map((item, index) => {
                            return (
                                <p style={{ marginLeft: "16px" }} className={`${styles.textDesc} ${styles.margB}`}>
                                    {renderI18nRichText({
                                        text: t(`final.part${index + 1}`),
                                        numberClassName: styles.num,
                                        linkClassName: styles.emailText,
                                        headingNumberClassName: styles.headNum
                                    })}
                                </p>
                            )
                        }
                        )
                    }

                </div>

                <div className={styles.contactForDataBlock}>
                    <h4 className={styles.titleSmall}>{t("dataProtectionContact.title")}</h4>

                    <div>
                        <p className={styles.textDesc}>
                            {
                                renderI18nRichText({
                                    text: t(`dataProtectionContact.company`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })
                            }

                        </p>
                        <p className={styles.textDesc}>
                            {
                                renderI18nRichText({
                                    text: t(`dataProtectionContact.id`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })
                            }
                        </p>
                        <p className={styles.textDesc}>
                            {
                                renderI18nRichText({
                                    text: t(`dataProtectionContact.address`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })
                            }
                        </p>
                        <p className={styles.textDesc}>
                            {
                                renderI18nRichText({
                                    text: t(`dataProtectionContact.email`),
                                    numberClassName: styles.num,
                                    linkClassName: styles.emailText,
                                    headingNumberClassName: styles.headNum
                                })
                            }
                        </p>
                    </div>
                </div>


            </Container>
        </>

    )
}

export default TermsPage