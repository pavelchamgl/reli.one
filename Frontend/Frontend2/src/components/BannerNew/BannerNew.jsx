import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next"

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import light from "../../assets/banner/light.svg";
import banner1 from "../../assets/banner/banner1.png";
import banner2 from "../../assets/banner/banner2.png";
import banner3 from "../../assets/banner/banner3.png";
import banner4 from "../../assets/banner/banner4.svg";
import banner5 from "../../assets/banner/banner5.svg";
import banner6 from "../../assets/banner/banner6.svg";

import styles from "./BannerNew.module.scss";

const Slide = ({ title, desc, img }) => {
    const isHund = useMediaQuery({ maxWidth: 1000 })

    const { t } = useTranslation("banners")


    return (
        <div className={styles.bannerWrap}>
            {
                isHund &&
                <div className={styles.navBtnWrap}>
                    <button className={styles.prevBtn}>‹</button>
                    <button className={styles.nextBtn}>›</button>
                </div>
            }
            <div className={styles.contentWrap}>
                {/* <div className={styles.btnWrap}>
                    <button>
                        <img src={light} alt="" />
                    </button>
                    <button>Update</button>
                </div> */}
                <div className={styles.textWrap}>
                    <h2>{title}</h2>
                    <p>{desc}</p>
                </div>
                <a href="https://reli.one/seller/login" className={styles.btn}>{t("startSelling")}</a>
            </div>
            <img
                className={styles.img}
                src={img}
                alt=""
            />

        </div>
    );
};

export default function BannerNew() {

    const isHund = useMediaQuery({ maxWidth: 1000 })

    const { t } = useTranslation("banners")

    const slides = [
        {
            title: t("banner1.title"),
            desc: t("banner1.desc"),
            img: banner1
        },
        {
            title: t("banner2.title"),
            desc: t("banner2.desc"),
            img: banner2
        },
        {
            title: t("banner3.title"),
            desc: t("banner3.desc"),
            img: banner3
        },
        {
            title: t("banner4.title"),
            desc: t("banner4.desc"),
            img: banner4
        },
        {
            title: t("banner5.title"),
            desc: t("banner5.desc"),
            img: banner5
        }
    ]

    return (
        <div className={styles.sliderWrap}>
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                navigation={{
                    nextEl: `.${styles.nextBtn}`,
                    prevEl: `.${styles.prevBtn}`,
                }}
                pagination={{ clickable: true }}
                autoplay={{
                    delay: 6000,
                    disableOnInteraction: false,
                }}
                loop={true}
            >
                {
                    slides?.map((item) => (
                        <SwiperSlide>
                            <Slide title={item.title} desc={item.desc} img={item.img} />
                        </SwiperSlide>
                    ))
                }
            </Swiper>

            {/* кастомные кнопки */}
            {
                !isHund &&
                <>
                    <button className={styles.prevBtn}>‹</button>
                    <button className={styles.nextBtn}>›</button>
                </>
            }
        </div>
    );
}
