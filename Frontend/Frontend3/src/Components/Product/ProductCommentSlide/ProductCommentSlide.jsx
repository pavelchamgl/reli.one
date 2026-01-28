import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import styles from "./ProductCommentSlide.module.scss";

const ProductCommentSlide = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <div className={styles.main}>
      <div ref={prevRef} className={styles.prev} />

      <Swiper
        modules={[Navigation]}
        slidesPerView={6}
        spaceBetween={5}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        navigation
        className={styles.swiper}
      >
        {[...Array(9)].map((_, index) => (
          <SwiperSlide key={index} className={styles.slide}>
            <img
              src="https://i.pinimg.com/564x/1d/5d/df/1d5ddfd9de61ee3b8d050681a37c698d.jpg"
              alt=""
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div ref={nextRef} className={styles.next} />
    </div>
  );
};

export default ProductCommentSlide;
