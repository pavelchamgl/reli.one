import instaIcon from "../../assets/Footer/insta.svg";
import faceIcon from "../../assets/Footer/facebook.svg";
import telegaIcon from "../../assets/Footer/tel.svg"
import tiktokIcon from "../../assets/Footer/tiktok.svg"
import linkedinIcon from "../../assets/Footer/linkedin.svg"

import cls from "./MessBtns.module.css"

const MessBtns = () => {
    return (
        <div className={cls.messBtns}>
            <a target="_blank" href="https://www.instagram.com/reli_just_one?igsh=MXU5b3RjcjhraXR0cQ%3D%3D&utm_source=qr">
                <img src={instaIcon} alt="" />
                <p>instagram</p>
            </a>
            <a target="_blank" href="https://www.facebook.com/share/1H2tBL8yDB/?mibextid=wwXIfr">
                <img src={faceIcon} alt="" />
                <p>facebook</p>
            </a>
            <a target="_blank" href="https://t.me/reli_marketplace">
                <img src={telegaIcon} alt="" />
                <p>telegram</p>
            </a>
            <a target="_blank" href="https://www.tiktok.com/@reli.one_new_one?_t=ZN-8xVXbMFsNQk&_r=1">
                <img src={tiktokIcon} alt="" />
                <p>tiktok</p>
            </a>
            <a target="_blank" href="https://www.linkedin.com/company/reli-group/">
                <img src={linkedinIcon} alt="" />
                <p>linkedin</p>
            </a>
        </div>
    )
}

export default MessBtns