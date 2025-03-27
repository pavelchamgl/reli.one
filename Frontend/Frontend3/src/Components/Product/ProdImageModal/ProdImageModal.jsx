import { Dialog } from "@mui/material"
import { useEffect, useState } from "react"
import { useMediaQuery } from "react-responsive"

import closeIcon from "../../../assets/loginModal/loginModalX.svg"
import closeWhIcon from "../../../assets/Product/closeWhIcon.svg"
import arrowIcon from "../../../assets/Product/detalImgSwiper.svg"

import styles from "./ProdImageModal.module.scss"

const ProdImageModal = ({ open, handleClose, imageUrl }) => {

    const isMobile = useMediaQuery({ maxWidth: 426 })

    const [count, setCount] = useState(0)

    // const imageUrl = [
    //     "https://i.pinimg.com/736x/b6/3d/a4/b63da431fc95db2b889ce3346e58a84e.jpg",
    //     "https://i.pinimg.com/474x/11/89/87/1189876f29ed661033f2048ae12b094c.jpg",
    //     "https://i.pinimg.com/736x/6d/16/a9/6d16a9a425c381ca1e07acb6aea4a11a.jpg",
    //     "https://i.pinimg.com/474x/9f/39/76/9f3976351e9b24fc1060e6e63194c7c2.jpg",
    //     "https://i.pinimg.com/474x/f2/a6/20/f2a620ff9fd63fea26593ae7e51c4d8c.jpg",
    //     "https://i.pinimg.com/474x/d7/50/49/d75049f04d6026adfb281124d5701728.jpg",
    //     "https://i.pinimg.com/736x/f0/6d/41/f06d41969fd78648cbaba372cf6a2a95.jpg"
    // ]


    useEffect(() => {
        console.log(imageUrl);

    }, [imageUrl])

    const handleNext = () => {
        if (count < imageUrl.length - 1) {
            setCount(count + 1)

        }
    }

    const handlePrev = () => {
        if (count !== 0) {
            setCount(count - 1)

        }
    }


    return (
        <Dialog fullScreen open={open} className={styles.modal}>
            <div className={styles.wrap}>
                <button className={styles.closeBtn} onClick={handleClose}>
                    <img src={isMobile ? closeWhIcon : closeIcon} alt="" />
                </button>
                <div className={styles.content}>
                    <div className={styles.sideImages}>
                        {
                            imageUrl?.length > 0 && imageUrl?.map((url, index) => (
                                <img onClick={() => setCount(index)} key={index} src={url?.image_url} alt="" />
                            ))
                        }

                    </div>
                    <div className={styles.slider}>
                        <button onClick={handlePrev}>
                            <img src={arrowIcon} alt="" />
                        </button>
                        <img className={styles.bigImg} src={imageUrl ? imageUrl[count]?.image_url : ""} alt="" />
                        <button onClick={handleNext}>
                            <img id="left" src={arrowIcon} alt="" />
                        </button>
                    </div>
                </div>
            </div>

        </Dialog>
    )
}

export default ProdImageModal

