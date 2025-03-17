import instaIcon from "../../assets/Footer/insta.svg";
import faceIcon from "../../assets/Footer/facebook.svg";

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
        </div>
    )
}

export default MessBtns