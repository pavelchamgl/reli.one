import React from 'react';
import Domu from './sections/Domu';
import Proc_Zrovna_Me from './sections/Proc_Zrovna_Me';
import News from './sections/News';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Kontakt from './sections/Kontakt';
import Footer from './sections/Footer';
import Vacancies from './sections/Vacancies';

const App = () => {
  return (
    <div className="font-Inter">
      <Domu />
      <Proc_Zrovna_Me />
      <Vacancies />
      <News />
      <Kontakt />
      <Footer />
    </div>
  );
};

export default App;
