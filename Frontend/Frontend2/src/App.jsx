import React from 'react';
import Domu from './sections/Domu';
import Proc_Zrovna_Me from './sections/Proc_Zrovna_Me';
import News from './sections/News';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Footer from './sections/Footer';
import Vacancies from './sections/Vacancies';
import NewKontakt from './sections/NewKontakt';

const App = () => {
  return (
    <div className="font-Inter">
      <Domu />
      <Proc_Zrovna_Me />
      <Vacancies />
      <News />
      <NewKontakt/>
      <Footer />
    </div>
  );
};

export default App;
