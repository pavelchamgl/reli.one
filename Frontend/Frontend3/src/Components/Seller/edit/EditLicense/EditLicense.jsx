import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { useMediaQuery } from "react-responsive"
import { useSelector } from "react-redux";

// Импорты стилей Swiper
import "swiper/css";
import "swiper/css/navigation";

// Импорт модулей Swiper
import { Navigation } from "swiper/modules";

import createMaskImg from "../../../../assets/Seller/create/fileIcon.svg";
import arrLeft from "../../../../assets/Seller/create/arrLeft.svg";
import arrRight from "../../../../assets/Seller/create/arrRight.svg";
import deleteCommentImage from "../../../../assets/Product/deleteCommentImage.svg";

import styles from "./EditLicense.module.scss"
import { useActionSellerEdit } from "../../../../hook/useActionSellerEdit";
import { useParams } from "react-router-dom";

const EditLicense = () => {
    const [imageUrls, setImageUrls] = useState([]);
    const [files, setFiles] = useState([]);
    const [isDisabled, setIsDisabled] = useState(false)

    const isMobile = useMediaQuery({ maxWidth: 427 })

    const { license_file } = useSelector(state => state.edit_goods)

    const { deleteLicense, setLicense, fetchDeleteLicense } = useActionSellerEdit()

    const { id } = useParams()


    useEffect(() => {
        if (!!license_file) {
            setIsDisabled(true)
        } else {
            setIsDisabled(false)
        }
    }, [license_file])


    const arr = 6


    const handleChangeFile = (e) => {
        const newFiles = Array.from(e.target.files);
        const updateFiles = [...files, ...newFiles];

        const readFilesAsBase64 = (files) => {
            return Promise.all(
                files.map((file) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file); // Читаем файл как Base64

                        reader.onloadend = () => {
                            resolve({
                                id: Date.now(),
                                base64: reader.result, // Кодировка Base64
                                name: file.name,
                                status: "local"
                            });
                        };

                        reader.onerror = () => {
                            reject(new Error("Ошибка чтения файла"));
                        };
                    });
                })
            );
        };

        readFilesAsBase64(newFiles)
            .then((base64Images) => {
                setLicense(base64Images[0])


            })
            .catch((error) => {
                console.error("Ошибка при кодировании файлов:", error);
            });
    };

    const handleDelete = (item) => {
        if (item?.status === "server") {
            fetchDeleteLicense({
                prodId: id,
                licId: item.id
            })
            deleteLicense()
        } else {
            deleteLicense()
        }
    };


    return (
        <div>
            <h3 className={styles.title}>License/Certificate</h3>
            <div className={styles.btnRatioWrap}>
                <p>Formats: docx, pdf</p>
                <label className={isDisabled ? styles.addPhotosDisabled : styles.addPhotos}>
                    <span >+ Add files</span>
                    <input
                        onChange={handleChangeFile}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        multiple
                        disabled={isDisabled}
                    />
                </label>
            </div>
            <div className={styles.sliderContainer}>
                <>
                    <Swiper
                        modules={isMobile ? [] : [Navigation]} // Условно подключаем Navigation
                        navigation={
                            !isMobile && {
                                nextEl: `.${styles.swiperLisenceNext}`,
                                prevEl: `.${styles.swiperLisencePrev}`,
                            }
                        }
                        spaceBetween={20} // Расстояние между слайдами
                        slidesPerView="auto" // Количество слайдов
                        className={styles.swiper}
                        direction="horizontal"
                    >
                        {!license_file ? (
                            <div className={styles.smallMaskWrap}>
                                {Array.from({ length: arr }, (_, index) => (
                                    <SwiperSlide key={index} className={styles.swiperSlide}>
                                        <div
                                            // className={error ? styles.maskErr : styles.mask}
                                            className={styles.mask}
                                        >
                                            <img src={createMaskImg} alt="mask" />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </div>
                        ) : (
                            license_file && [license_file]?.map((url, index) => (
                                <SwiperSlide key={index} className={styles.swiperSlide}>
                                    <div>
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
                                            <div className={styles.smallMaskWrap}>
                                                <div
                                                    // className={err ? styles.maskErr : styles.mask}
                                                    className={styles.mask}
                                                >
                                                    <img src={createMaskImg} alt="mask" />
                                                </div>
                                            </div>
                                        </div>
                                        <p className={styles.fileName}>
                                            {/\.(pdf|docx)$/i.test(url?.name)
                                                ? (url?.name.length > 19
                                                    ? url?.name.slice(0, 12) + "..." + url?.name.slice(-4)  // Учитываем любое расширение
                                                    : url?.name
                                                )
                                                : "dock"
                                            }
                                        </p>
                                    </div>
                                </SwiperSlide>
                            ))
                        )}
                    </Swiper>
                    <button className={styles.swiperLisencePrev}>
                        <img src={arrLeft} alt="" />
                    </button>
                    <button className={styles.swiperLisenceNext}>
                        <img src={arrRight} alt="" />
                    </button>
                </>
            </div>
            {/* {error ? <p className={styles.errText}>Image is required</p> : <></>} */}

            {/* Кнопки навигации */}
        </div>
    );
}

export default EditLicense