import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { useMediaQuery } from "react-responsive"

// Импорты стилей Swiper
import "swiper/css";
import "swiper/css/navigation";

// Импорт модулей Swiper
import { Navigation } from "swiper/modules";

import createMaskImg from "../../../../assets/Seller/create/maskImg.svg";
import arrLeft from "../../../../assets/Seller/create/arrLeft.svg";
import arrRight from "../../../../assets/Seller/create/arrRight.svg";
import deleteCommentImage from "../../../../assets/Product/deleteCommentImage.svg";

import styles from "./SellerCreateImages.module.scss";


const SellerCreateImage = () => {
  const [imageUrls, setImageUrls] = useState([]);
  const [files, setFiles] = useState([]);


  const isMobile = useMediaQuery({ maxWidth: 427 })

  const arr = 6

  const handleChangeFile = (e) => {
    const newFiles = Array.from(e.target.files);
    const updateFiles = [...files, ...newFiles];
    setFiles(updateFiles);

    newFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImageUrls((prevUrls) => [...prevUrls, url]);
    });
  };

  const handleDelete = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedUrls = imageUrls.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setImageUrls(updatedUrls);
  };

  return (
    <div>
      <h3 className={styles.title}>Photo</h3>
      <div className={styles.btnRatioWrap}>
        <p>Aspect ratio 1:1</p>
        <label className={styles.addPhotos}>
          <span>+ Add photos</span>
          <input
            onChange={handleChangeFile}
            type="file"
            accept="image/*"
            multiple
          />
        </label>
      </div>
      <div className={styles.sliderContainer}>
        <>
          <Swiper
            modules={isMobile ? [] : [Navigation]} // Условно подключаем Navigation
            navigation={
              !isMobile && {
                nextEl: `.${styles.swiperButtonNext}`,
                prevEl: `.${styles.swiperButtonPrev}`,
              }
            }
            spaceBetween={20} // Расстояние между слайдами
            slidesPerView="auto" // Количество слайдов
            className={styles.swiper}
            direction="horizontal"
          >
            {imageUrls.length === 0 ? (
              <div className={styles.smallMaskWrap}>
                {Array.from({ length: arr }, (_, index) => (
                  <SwiperSlide key={index} className={styles.swiperSlide}>

                    <div className={styles.mask}>
                      <img style={{ width: "18px", height: "18px" }} src={createMaskImg} alt="mask" />
                    </div>

                  </SwiperSlide>
                ))}
              </div>
            ) : (
              imageUrls.map((url, index) => (
                <SwiperSlide key={index} className={styles.swiperSlide}>
                  <div
                    className={styles.imageWrapper}
                    onMouseEnter={(e) =>
                      e.currentTarget.classList.add(styles.hovered)
                    }
                    onMouseLeave={(e) =>
                      e.currentTarget.classList.remove(styles.hovered)
                    }
                  >
                    <div className={styles.deleteWrap}>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(index)}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13 13L7.00002 7.00002M7.00002 7.00002L1 1M7.00002 7.00002L13 1M7.00002 7.00002L1 13"
                            stroke="#D55B5B"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <img
                      className={styles.mediaPreview}
                      src={url}
                      alt={`Preview ${index}`}
                    />
                  </div>
                </SwiperSlide>
              ))
            )}
          </Swiper>
          <button className={styles.swiperButtonPrev}>
            <img src={arrLeft} alt="" />
          </button>
          <button className={styles.swiperButtonNext}>
            <img src={arrRight} alt="" />
          </button>
        </>
      </div>

      {/* Кнопки навигации */}
    </div>
  );
};

export default SellerCreateImage;
