import React from 'react';
import oschepkova from '../assets/oschepkova.png';
import email_icon from '../assets/email_icon.png';
import phone_icon from '../assets/phone_icon.png';
import adress_icon from '../assets/adress_icon.png';

const Kontakt = () => {
  return (
    <div className="bg-[#F8FDFF] px-7 pb-10 xl:mx-auto xl:max-w-[1439px] xl:px-36">
      <p>Kontakt</p>
      <div className="xl:flex">
        <div className="mb-6 flex flex-1 flex-col gap-10">
          <div className="flex">
            <div className=" max-h-[300px] flex-1 overflow-hidden">
              <img src={oschepkova} className=" object-cover" alt="" />
            </div>
            <div className="flex flex-1 flex-col justify-between rounded-r-2xl bg-[#F5F5F5] py-16">
              <p className="text-center font-bold xl:text-[26px]">
                Ing. Daria Oshchepkova
              </p>
              <p className="text-center text-[12px] font-medium">
                Generální manažerkas
              </p>
            </div>
          </div>
          <div className="hidden h-5 rounded-full bg-[#FFCC00] xl:block"></div>
          <div>
            <p className="text-lg font-bold">Number:</p>
            <div className="mt-4 flex items-center rounded-2xl bg-[#F5F5F5] p-2 px-5">
              <div className="mr-7 w-[40px]">
                <img src={phone_icon} alt="" />
              </div>
              <p className="font-medium">+420 797 837 856</p>
            </div>
          </div>
        </div>
        <div className="mx-16 hidden xl:flex xl:flex-col xl:items-center">
          <div className="mb-7 h-[50%] w-5 rounded-full bg-[#FFCC00]"></div>
          <div className="mb-6 h-16 w-16 rounded-full bg-[#FFCC00]"></div>
          <div className=" h-[30%] w-5 rounded-full bg-[#FFCC00]"></div>
        </div>
        <div className="flex flex-1 flex-col gap-10">
          <div className="flex flex-col items-center gap-5 rounded-2xl bg-[#F5F5F5] py-7 xl:py-12">
            <div>
              <img src={email_icon} alt="" />
            </div>
            <p className="text-xl font-bold xl:text-3xl">Email</p>
            <p className="xl:text-xl">oshchepkova.solar@gmail.com</p>
          </div>
          <div className="hidden h-5 rounded-full bg-[#FFCC00] xl:block"></div>
          <div className="flex items-end rounded-2xl bg-[#F5F5F5] p-2 px-5 xl:p-5">
            <div className="mr-3 flex flex-col items-center">
              <p className="text-xl font-bold">Adress:</p>
              <img src={adress_icon} className="w-[40px]" alt="" />
            </div>
            <p className="xl:text-lg">
              Na Lysinách 551/34, Praha 4 - Hodkovičky, PSČ 147 00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kontakt;
