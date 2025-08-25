import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { useMediaQuery } from "react-responsive"
import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

// Импорты стилей Swiper
import "swiper/css";
import "swiper/css/navigation";

// Импорт модулей Swiper
import { Navigation } from "swiper/modules";

import createMaskImg from "../../../../assets/Seller/create/maskImg.svg";
import arrLeft from "../../../../assets/Seller/create/arrLeft.svg";
import arrRight from "../../../../assets/Seller/create/arrRight.svg";
import deleteCommentImage from "../../../../assets/Product/deleteCommentImage.svg";

import styles from "./SellerEditImages.module.scss";


const SellerEditImages = ({ err, setErr }) => {
    const [imageUrls, setImageUrls] = useState([]);
    const [files, setFiles] = useState([]);

    const { id } = useParams()
    const isMobile = useMediaQuery({ maxWidth: 427 })

    const { fetchGetImages, deleteImage, fetchDeleteImage, setImages } = useActionSellerEdit()

    const { images } = useSelector(state => state.edit_goods)

    const arr = 6

    // useEffect(() => {
    //     // setFilesMain(files)

    //     let imagesArr = [];

    //     if (imageUrls?.length > 0) {

    //         imagesArr = imageUrls.map((item) => {
    //             return {
    //                 image_url: item
    //             }
    //         })
    //     }
    // }, [imageUrls, files])

    // useEffect(() => {
    //     fetchGetImages(id)
    // }, [id])


    useEffect(() => {
        if (images?.length > 0) {
            setErr(false)
        }
    }, [images])

    const handleChangeFile = (e) => {
        const newFiles = Array.from(e.target.files);
        const updateFiles = [...files, ...newFiles];
        setFiles(updateFiles);

        newFiles.forEach((file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = () => {
                const base64 = reader.result;
                setImages([
                    {
                        id: Date.now(),
                        image: base64,
                        image_url: base64,
                        status: "local"
                    }
                ])
            };

            reader.onerror = (error) => {
                console.error("Ошибка при чтении файла:", error);
            };
        });
    };


    const handleDelete = (url) => {
        if (url?.status === "local") {
            deleteImage({ id: url.id })
        } else {
            fetchDeleteImage({
                prodId: id,
                imageId: url.id
            })
        }
        // const updatedFiles = files.filter((_, i) => i !== index);
        // const updatedUrls = imageUrls.filter((_, i) => i !== index);
        // setFiles(updatedFiles);
        // setImageUrls(updatedUrls);
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
                        accept="image/*,video/*"
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
                        {images?.length === 0 || !images ? (
                            <div className={styles.smallMaskWrap}>
                                {Array.from({ length: arr }, (_, index) => (
                                    <SwiperSlide key={index} className={styles.swiperSlide}>

                                        <div className={err ? styles.maskErr : styles.maskk}>
                                            <img style={{ width: "18px", height: "18px" }} src={createMaskImg} alt="mask" />
                                        </div>

                                    </SwiperSlide>
                                ))}
                            </div>
                        ) : (
                            images?.map((url, index) => (
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
                                                onClick={() => handleDelete(url)}
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
                                            src={url?.image_url}
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
            {err ? <p className={styles.errText}>Image is required</p> : <></>}


            {/* Кнопки навигации */}
        </div>
    );
};

export default SellerEditImages;
