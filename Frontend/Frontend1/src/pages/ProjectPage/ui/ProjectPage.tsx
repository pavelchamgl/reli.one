import { useTranslation } from 'react-i18next'
import profile from '../models/imgs/Profile.png'
import job from '../models/imgs/Job.png'
import key from '../models/imgs/Key.png'
import cls from '../models/styles/AboutPage.module.scss'
import {useEffect} from "react";
const ProjectPage: React.FC = () => {
    const { t } = useTranslation()
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    return (<>
        <div className={cls.Container_About}>
            <h1>{t('Jak objednat?')}</h1>

            <div>
                <div className={cls.Order_container}><img src = {profile}/> <h2>{t('Malé objednávky ')}</h2></div>
                <p>{t('Zvolením a vložením zboží do košíku provedete zde svůj nákup')}</p>
            </div>

            <div>
                <div className={cls.Order_container}><img src = {job}/> <h2>{t('Velkým společnostem')}</h2></div>
                <p>{t('Tady se můžete spojit s generálním manažerem společnosti Solopharma Group s.r.o, kde se proberou všechny otázky na základě Vaší poptávky ')}</p>
            </div>

            <div>
                <div className={cls.Order_container}><img src = {key} /> <h2>{t('Projekt na klíč')}</h2></div>
                <p>{t('Spojte se s manažery naší společnosti Solopharma Group, s.r.o a probereme spolu všechna možná řešení a Vaše osobní požadavky. Připravíme nabídku na míru Vašim potřebám, zpracujeme potřebné doklady, projednáme následující instalaci a vyřízení dotace')}</p>
            </div>

        </div>
    </>)
}
export default ProjectPage
