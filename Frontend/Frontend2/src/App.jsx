import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

import Domu from './sections/Domu';
import Proc_Zrovna_Me from './sections/Proc_Zrovna_Me';
import News from './sections/News';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Footer from './sections/Footer';
import Vacancies from './sections/Vacancies';
import NewKontakt from './sections/NewKontakt';
import ChangeLang from './components/changeLang/ChangeLang';
import Header from './components/Header/Header';
import FocusOnBuss from './blocks/FocusOnBussines/FocusOnBuss';
import SellingIsEasy from './blocks/SellingIsEasy/SellingIsEasy';
import WhyChoose from './blocks/WhyChoose/WhyChoose';
import HowItWorks from './blocks/HowItWorks/HowItWorks';
import OurSellersSay from './blocks/OurSellersSay/OurSellersSay';

const App = () => {

  const { i18n } = useTranslation();

  useEffect(() => {
    const updateURL = (lng) => {
      const params = new URLSearchParams(window.location.search);
      params.set("language", lng);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    };

    // начальная проверка при загрузке
    const initialLang = i18n.language;
    const params = new URLSearchParams(window.location.search);
    if (!params.get("language")) {
      updateURL(initialLang);
    }

    // подписка на смену языка
    i18n.on("languageChanged", updateURL);

    // очистка при размонтировании
    return () => {
      i18n.off("languageChanged", updateURL);
    };
  }, [i18n]);


  return (
    <div className="font-Inter relative">
      {/* <Header />
      <div className="h-[662px] bg-slate-600"></div>
      <FocusOnBuss />
      <SellingIsEasy />
      <WhyChoose />
      <HowItWorks />
      <OurSellersSay /> */}

      <Domu />
      <Proc_Zrovna_Me />
      <Vacancies />
      <News />
      <NewKontakt />
      <Footer />
      <ChangeLang />
    </div>
  );
};

export default App;
