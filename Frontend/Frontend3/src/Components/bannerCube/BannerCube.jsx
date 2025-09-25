import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFlip, Pagination, Autoplay } from "swiper/modules";

// Swiper стили
import "swiper/css";
import "swiper/css/effect-flip";
import "swiper/css/pagination";

import frontBanner from "../../assets/banner/frontBanner.jpg"
import backBanner from "../../assets/banner/bannerBack.jpeg"

// SCSS модуль
import styles from "./BannerCube.module.scss";

export default function BannerCube() {
  return (
    <div className={styles.wrapper}>
      <Swiper
        effect="flip"
        grabCursor={true}
        autoplay={{
          delay: 2000, // работает только для картинок
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={true}
        pagination={{ clickable: true, bulletActiveClass: styles.paginationActive, }}
        modules={[EffectFlip, Pagination, Autoplay]}
        className={styles.swiper}
      >
        {/* Передняя сторона */}
        <SwiperSlide>
          <div className={styles.front}>
            {/* <img className={styles.img} src={frontBanner} alt="" /> */}
          </div>
        </SwiperSlide>

        {/* Задняя сторона */}
        <SwiperSlide>
          <div className={styles.back}></div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
