import { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import styles from "./BannerSlider.module.css";

import arrowIcon from "../../assets/detalImgSwiper.svg"


const BannerSlider = () => {
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const paginationRef = useRef(null);
    const [swiperReady, setSwiperReady] = useState(false);

    useEffect(() => {
        // Задержка нужна, чтобы refs попали в DOM
        setSwiperReady(true);
    }, []);

    const images = [
        "https://i.pinimg.com/736x/32/5c/ff/325cff33a4ed1d703fe740f796ee33ed.jpg",
        "https://i.pinimg.com/736x/57/ed/10/57ed10178667bab8f5cca8ec105f3a2c.jpg",
        "https://i.pinimg.com/736x/41/be/77/41be776eb3651a0607d9e5bdc3c7c8e5.jpg",
        "https://i.pinimg.com/736x/32/5c/ff/325cff33a4ed1d703fe740f796ee33ed.jpg",
        "https://i.pinimg.com/736x/57/ed/10/57ed10178667bab8f5cca8ec105f3a2c.jpg",
        "https://i.pinimg.com/736x/41/be/77/41be776eb3651a0607d9e5bdc3c7c8e5.jpg",
        "https://i.pinimg.com/736x/32/5c/ff/325cff33a4ed1d703fe740f796ee33ed.jpg",
        "https://i.pinimg.com/736x/57/ed/10/57ed10178667bab8f5cca8ec105f3a2c.jpg",
        "https://i.pinimg.com/736x/41/be/77/41be776eb3651a0607d9e5bdc3c7c8e5.jpg",
    ];

    return (
        <div className={styles.swiperContainer}>
            {/* Стрелки и пагинация — вне Swiper */}
            <div ref={prevRef} className={styles.swiperButtonPrev}>
                <img src={arrowIcon} alt="" />
            </div>
            <div ref={nextRef} className={styles.swiperButtonNext}>
                <img src={arrowIcon} className={styles.left} alt="" />
            </div>
            <div ref={paginationRef} className={styles.swiperPagination}></div>

            {swiperReady && (
                <Swiper
                    cssMode={true}
                    navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current,
                    }}
                    pagination={{
                        el: paginationRef.current,
                        clickable: true,
                        bulletActiveClass: styles.paginationActive,
                    }}
                    mousewheel={true}
                    keyboard={true}
                    modules={[Navigation, Pagination, Mousewheel, Keyboard]}
                    className={styles.swiper}
                // breakpoints={{
                //   320: { slidesPerView: 1, spaceBetween: 10 },
                //   640: { slidesPerView: 2, spaceBetween: 20 },
                //   1024: { slidesPerView: 3, spaceBetween: 30 },
                // }}
                >
                    {images.map((item, index) => (
                        <SwiperSlide key={index} className={styles.swiperSlide}>
                            <img src={item} alt={`img-${index}`} className={styles.bannerImg} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}
        </div>
    );
};

export default BannerSlider;
