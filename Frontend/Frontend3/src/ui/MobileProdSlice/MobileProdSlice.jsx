import React from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";

import styles from "./MobileProdSlice.module.scss";

// import required modules
import { FreeMode, Pagination } from "swiper/modules";

const MobileProdSwiper = () => {
  return (
    <Swiper
      slidesPerView={3}
      spaceBetween={30}
      freeMode={true}
      pagination={{
        clickable: true,
        bulletActiveClass: styles.paginationActive,
      }}
      modules={[FreeMode, Pagination]}
      className={styles.swiper}
      breakpoints={{
        // when window width is >= 320px
        320: {
          slidesPerView: 1,
          spaceBetween: 10,
        },
        // when window width is >= 480px
        480: {
          slidesPerView: 2,
          spaceBetween: 20,
        },
        // when window width is >= 640px
        640: {
          slidesPerView: 3,
          spaceBetween: 30,
        },
      }}
    >
      <SwiperSlide className={styles["swiper-slide"]}>
        <img
          src="https://i.pinimg.com/736x/3d/61/8c/3d618cb1cf1529c2f88cc149d91805d0.jpg"
          alt=""
        />
      </SwiperSlide>
      <SwiperSlide className={styles["swiper-slide"]}>Slide 2</SwiperSlide>
      <SwiperSlide className={styles["swiper-slide"]}>Slide 3</SwiperSlide>
      <SwiperSlide className={styles["swiper-slide"]}>Slide 4</SwiperSlide>
      <SwiperSlide className={styles["swiper-slide"]}>Slide 5</SwiperSlide>
      <SwiperSlide className={styles["swiper-slide"]}>Slide 6</SwiperSlide>
      <SwiperSlide className={styles["swiper-slide"]}>Slide 7</SwiperSlide>
      <SwiperSlide className={styles["swiper-slide"]}>Slide 8</SwiperSlide>
      <SwiperSlide className={styles["swiper-slide"]}>Slide 9</SwiperSlide>
    </Swiper>
  );
};

export default MobileProdSwiper;
