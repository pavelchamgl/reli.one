import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { useMediaQuery } from "react-responsive"
import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import "swiper/css";
import "swiper/css/navigation";

import { Navigation } from "swiper/modules";
import { validateProductImageFiles } from "../../../../utils/sellerProductWizard";

import createMaskImg from "../../../../assets/Seller/create/maskImg.svg";
import arrLeft from "../../../../assets/Seller/create/arrLeft.svg";
import arrRight from "../../../../assets/Seller/create/arrRight.svg";

import styles from "./SellerEditImages.module.scss";


const SellerEditImages = ({ err, setErr }) => {
    const [files, setFiles] = useState([]);
    const [fileError, setFileError] = useState("");

    const { id } = useParams()
    const isMobile = useMediaQuery({ maxWidth: 427 })

    const { deleteImage, fetchDeleteImage, setImages } = useActionSellerEdit()

    const { images } = useSelector(state => state.edit_goods)

    const arr = 6

    const { t } = useTranslation('sellerHome')

    useEffect(() => {
        if (images?.length > 0) {
            setErr(false)
        }
    }, [images])

    const handleChangeFile = (e) => {
        const newFiles = Array.from(e.target.files);
        const nextError = validateProductImageFiles(newFiles, t);
        if (nextError) {
            setFileError(nextError);
            e.target.value = "";
            return;
        }
        setFileError("");
        setErr(false);
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
    };

    return (
        <div>
            <h3 className={styles.title}>{t('goods.photo')}</h3>
            <div className={styles.btnRatioWrap}>
                <p>{t('goods.aspectRatio')}</p>
                <label className={styles.addPhotos}>
                    <span>{t('goods.addPhotos')}</span>
                    <input
                        onChange={handleChangeFile}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        multiple
                    />
                </label>
            </div>
            <div className={styles.sliderContainer}>
                <>
                    <Swiper
                        modules={isMobile ? [] : [Navigation]}
                        navigation={
                            !isMobile && {
                                nextEl: `.${styles.swiperButtonNext}`,
                                prevEl: `.${styles.swiperButtonPrev}`,
                            }
                        }
                        spaceBetween={20}
                        slidesPerView="auto"
                        className={styles.swiper}
                        direction="horizontal"
                    >
                        {images?.map((url, index) => (
                            <SwiperSlide key={`image-${url?.id ?? index}`} className={styles.swiperSlide}>
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
                                            type="button"
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
                                        alt=""
                                    />
                                </div>
                            </SwiperSlide>
                        ))}
                        {Array.from({ length: Math.max(0, arr - (images?.length ?? 0)) }, (_, index) => (
                            <SwiperSlide key={`placeholder-${index}`} className={styles.swiperSlide}>
                                <div className={err ? styles.maskErr : styles.mask}>
                                    <img style={{ width: "18px", height: "18px" }} src={createMaskImg} alt="" />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    <button type="button" className={styles.swiperButtonPrev}>
                        <img src={arrLeft} alt="" />
                    </button>
                    <button type="button" className={styles.swiperButtonNext}>
                        <img src={arrRight} alt="" />
                    </button>
                </>
            </div>
            {fileError ? <p className={styles.errText}>{fileError}</p> : null}
            {err ? <p className={styles.errText}>{t('goods.errors.imageRequired')}</p> : null}
        </div>
    );
};

export default SellerEditImages;
