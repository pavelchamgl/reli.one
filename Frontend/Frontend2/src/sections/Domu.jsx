import React from 'react';
import Header_menu from '../components/Header_menu';
import About from '../components/About';
import divider from '../assets/divider_domu.png';

const Domu = () => {
  return (
    <>
      <div className="bg-[url('assets/background-phone.png')] bg-cover lg:bg-[url(assets/image.png)]">
        <div className="xl:mx-auto xl:max-w-[1439px]" id="Domu">
          <div className="px-7 lg:px-10 xl:px-32">
            <Header_menu />
            <About />
          </div>
        </div>
        <img src={divider} className="w-full" alt="" />
      </div>
    </>
  );
};

export default Domu;
