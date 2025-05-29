import React, { useState } from "react";
import { useSelector } from "react-redux";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";

import styles from "./MobileProdSlice.module.scss";

// import required modules
import { FreeMode, Pagination } from "swiper/modules";
import ProdImageModal from "../../Components/Product/ProdImageModal/ProdImageModal";

const MobileProdSwiper = ({ imageProps }) => {
  const { images } = useSelector((state) => state.products.product);

  const [isModalOpen, setIsMOdalOpen] = useState(false)


  if (images) {
    return (
      <>
        <Swiper
          slidesPerView={3}
          spaceBetween={30}
          pagination={{
            clickable: true,
            bulletActiveClass: styles.paginationActive,
          }}
          modules={[ Pagination]}
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
          {images?.map((item, index) => (
            <SwiperSlide key={index} className={styles["swiper-slide"]}>
              <img onClick={() => setIsMOdalOpen(!isModalOpen)} src={item?.image_url} alt="" />
            </SwiperSlide>
          ))}
        </Swiper>
        <ProdImageModal open={isModalOpen} handleClose={() => setIsMOdalOpen(false)} imageUrl={images} />
      </>
    );
  }

  if (imageProps) {
    return (
      <>
        <Swiper
          slidesPerView={3}
          spaceBetween={30} 
          // freeMode={true}
          pagination={{
            clickable: true,
            bulletActiveClass: styles.paginationActive,
          }}
          modules={[ Pagination]}
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
          {imageProps?.map((item, index) => (
            <SwiperSlide key={index} className={styles["swiper-slide"]}>
              <img src={item?.image_url} alt="" />
            </SwiperSlide>
          ))}
        </Swiper>
        <ProdImageModal />
      </>
    );
  }
};

export default MobileProdSwiper;
