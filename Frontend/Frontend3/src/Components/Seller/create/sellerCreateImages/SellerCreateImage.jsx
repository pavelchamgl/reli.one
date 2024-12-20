import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

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

const SellerCreateImageMask = () => {
  const arr = [
    1, 2, 3, 4, 5, 2, 3, 4, 5, 6, 7, 8, 0, 4, 5, 6, 7, 8, 89, 4, 54, 4,
  ];

  return (
    <div className={styles.maskMain}>
      <div className={styles.bigMask}>
        <img src={createMaskImg} alt="mask" />
      </div>
      <div className={styles.smallMaskWrap}>
        {arr.map((item, index) => (
          <div key={index}>
            <img src={createMaskImg} alt="mask" />
          </div>
        ))}
      </div>
    </div>
  );
};

const SellerCreateImage = () => {
  const [imageUrls, setImageUrls] = useState([]);
  const [files, setFiles] = useState([]);

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
      {imageUrls.length === 0 ? (
        <SellerCreateImageMask />
      ) : (
        <div className={styles.sliderContainer}>
          <>
            <Swiper
              modules={[Navigation]}
              navigation={{
                nextEl: `.${styles.swiperButtonNext}`,
                prevEl: `.${styles.swiperButtonPrev}`,
              }}
              spaceBetween={20} // Расстояние между слайдами
              slidesPerView="auto" // Количество слайдов
              className={styles.swiper}
            >
              {imageUrls.map((url, index) => (
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
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <img
                      src={url}
                      alt={`Preview ${index}`}
                      className={styles.mediaPreview}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <button className={styles.swiperButtonPrev}>
              <img src={arrLeft} alt="" />
            </button>
            <button className={styles.swiperButtonNext}>
              <img src={arrRight} alt="" />
            </button>
          </>
        </div>
      )}
      {/* Кнопки навигации */}
    </div>
  );
};

export default SellerCreateImage;
