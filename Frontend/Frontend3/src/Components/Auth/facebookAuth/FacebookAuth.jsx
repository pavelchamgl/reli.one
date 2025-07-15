import FacebookLogin from 'react-facebook-login';
import facebookIcon from "../../../assets/Auth/facebookIc.svg"

import styles from "./FacebookAuth.module.scss"

const FacebookAuth = () => {
    const responseFacebook = (response) => {
        console.log(response);
        // Здесь можно обработать ответ Facebook, например, отправить токен на сервер
    };

    return (
        <div>
            <FacebookLogin
                appId="1651574469095196" // Замените на ваш App ID
                autoLoad={false} // Опционально: автоматически показывать кнопку
                fields="name,email,picture"
                callback={responseFacebook}
                textButton="Facebook"
                cssClass={styles.button} // Вы можете стилизовать кнопку
                icon={<img src={facebookIcon} alt=''/>} // Иконка Facebook (требуется font-awesome)
            />
        </div>
    );
};

export default FacebookAuth;
