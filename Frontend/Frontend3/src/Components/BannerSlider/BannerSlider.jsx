import { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import styles from "./BannerSlider.module.scss";

import arrowIcon from "../../assets/Product/detalImgSwiper.svg";

const BannerSlider = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const paginationRef = useRef(null);
  const [swiperReady, setSwiperReady] = useState(false);

  useEffect(() => {
    setSwiperReady(true);
  }, []);

  const images = [
    "https://i.pinimg.com/736x/32/5c/ff/325cff33a4ed1d703fe740f796ee33ed.jpg",
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://i.pinimg.com/736x/32/5c/ff/325cff33a4ed1d703fe740f796ee33ed.jpg",
    "https://i.pinimg.com/736x/57/ed/10/57ed10178667bab8f5cca8ec105f3a2c.jpg",
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://i.pinimg.com/736x/41/be/77/41be776eb3651a0607d9e5bdc3c7c8e5.jpg",
    "https://i.pinimg.com/736x/32/5c/ff/325cff33a4ed1d703fe740f796ee33ed.jpg",
    "https://i.pinimg.com/736x/57/ed/10/57ed10178667bab8f5cca8ec105f3a2c.jpg",
    "https://i.pinimg.com/736x/41/be/77/41be776eb3651a0607d9e5bdc3c7c8e5.jpg",
  ];

  const isImage = (url) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
  const isVideo = (url) => /\.(mp4|webm|ogg|mov|avi)$/i.test(url);

  return (
    <div className={styles.swiperContainer}>
      <div ref={prevRef} className={styles.swiperButtonPrev}>
        <img src={arrowIcon} alt="prev" />
      </div>
      <div ref={nextRef} className={styles.swiperButtonNext}>
        <img src={arrowIcon} className={styles.left} alt="next" />
      </div>
      <div ref={paginationRef} className={styles.swiperPagination}></div>

      {swiperReady && (
        <Swiper
          slidesPerView={1}
          spaceBetween={10}
          slidesPerGroup={1}       // Вот ключевой параметр — листаем по 1 слайду
          loop={false}             // Можно поставить true, если нужен бесконечный цикл
          mousewheel={true}        // Можно включить, если хочешь прокрутку колесом
          keyboard={true}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          pagination={{
            el: paginationRef.current,
            clickable: true,
            bulletActiveClass: styles.paginationActive,
          }}
          modules={[Navigation, Pagination, Mousewheel, Keyboard]}
          className={styles.swiper}
          onSwiper={(swiper) => {
            // Навигация может не сразу подцепиться, обновляем её вручную
            setTimeout(() => {
              swiper.navigation.init();
              swiper.navigation.update();
              swiper.pagination.init();
              swiper.pagination.update();
            });
          }}
          breakpoints={{
            640: {
              slidesPerView: 1,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 1,
              spaceBetween: 30,
            },
          }}
        >
          {images.map((item, index) => (
            <SwiperSlide key={index} className={styles.swiperSlide}>
              {isImage(item) ? (
                <img src={item} alt={`img-${index}`} className={styles.bannerImg} />
              ) : isVideo(item) ? (
                <video
                  src={item}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className={styles.bannerVideo}
                />
              ) : (
                <div>Unsupported format</div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};

export default BannerSlider;
