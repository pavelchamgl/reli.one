import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import "./ProductCommentSlide.scss";

const ProductCommentSlide = () => {
  return (
    <div className="main">
      <div className="swiper-button-prev"></div>  {/* Кнопка предыдущего слайда */}
      <Swiper
        modules={[Navigation]} // Подключаем модуль навигации
        navigation={{
          nextEl: '.swiper-button-next', // Селектор для кнопки следующего слайда
          prevEl: '.swiper-button-prev', // Селектор для кнопки предыдущего слайда
        }}
        slidesPerView={6} // Количество слайдов, которые видны одновременно
        spaceBetween={5} // Расстояние между слайдами
        className="mySwiper"
      >
        {/* Добавляем слайды */}
        {[...Array(9)].map((_, index) => (
          <SwiperSlide key={index}>
            <img
              src="https://i.pinimg.com/564x/1d/5d/df/1d5ddfd9de61ee3b8d050681a37c698d.jpg"
              alt=""
            />
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="swiper-button-next"></div>  {/* Кнопка следующего слайда */}
    </div>
  );
};

export default ProductCommentSlide;
