import React from 'react';
import newImage from '../assets/newImage.svg';
import emailIcon from '../assets/email_icon.png';
import phoneIcon from '../assets/phone_icon.png';
import addressIcon from '../assets/adress_icon.png';

import styles from "../css/Kontakt.module.css"

const Kontakt = () => (
  <div className="bg-[#F8FDFF]">
    <div className="px-7 pb-10 xl:mx-auto xl:max-w-[1439px] xl:px-36" id="Kontakt">
      <p className="py-12 text-5xl font-bold">Kontakt</p>
      <div className=''>
        <div className='flex justify-between items-start flex-wrap'>
          <img className='w-[442px] xl:w-full' src={newImage} alt="" />
          <div className="w-5 h-[250px] bg-[#FFCC00] rounded-full xl: hidden"></div>
          <div className="w-[442px] flex flex-col items-center gap-5 bg-[#F5F5F5] rounded-2xl py-7 xl:py-12 xl:w-full xl:h-[157px] h-auto">
            <img src={emailIcon} alt="Email" className="w-12" />
            <p className="text-xl font-bold xl:text-3xl">Email</p>
            <p className="xl:text-xl">info.reli.one@gmail.com</p>
          </div>
        </div>

        <div className='mb-[25px] flex justify-between items-center'>
          <div className="w-[473px] h-5 bg-[#FFCC00] rounded-full "></div>
          <div className="w-[85px] h-[85px] bg-[#FFCC00] rounded-full "></div>
          <div className="w-[473px] h-5 bg-[#FFCC00] rounded-full "></div>
        </div>

        <div className='flex justify-between items-center flex-wrap'>
          <div className=''>
            <p className="text-lg font-bold">Number:</p>
            <div className="w-[442px] mt-4 flex items-center bg-[#F5F5F5] rounded-2xl p-2 px-5">
              <img className='w-10 h-10 mr-4' src={phoneIcon} alt="Phone" />
              <p className="font-medium">+420 797 837 856</p>
            </div>
          </div>
          <div className="w-5 h-[132px] bg-[#FFCC00] rounded-full "></div>

          <div className=" w-[442px] h-[139px] flex items-end bg-[#F5F5F5] rounded-2xl p-2 px-5 xl:p-5">
            <div className="mr-3 flex flex-col items-center">
              <p className="text-xl font-bold">Address:</p>
              <img src={addressIcon} className="w-10" alt="Address" />
            </div>
            <p className="xl:text-lg">
              Na Lysinách 551/34, Praha 4 - Hodkovičky, PSČ 147 00
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
);

export default Kontakt;
