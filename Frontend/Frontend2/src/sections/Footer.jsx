import React from 'react';
import SoloPharma_footer_logo from '../assets/SoloPharma-footer-logo.png';

const Footer = () => {
  return (
    <div className="bg-[#333333] py-10 text-white xl:mx-auto xl:flex xl:max-w-[1439px] xl:justify-between xl:px-32 xl:pt-10">
      <div className="mb-7 flex flex-col items-center gap-10 xl:mb-0">
        <p>Domů</p>
        <p>Proč zrovna my?</p>
        <p>Volné místo</p>
        <p>Aktuality</p>
        <p>Kontakt</p>
      </div>
      <div className="flex flex-col items-center justify-end gap-5">
        <img src={SoloPharma_footer_logo} className="w-[200px]" alt="" />
        <p className="text-xs">(c) Copyright 2023 Solopharma Group</p>
      </div>
      <div className="hidden flex-col justify-between xl:flex">
        <p className="text-2xl text-[#FFCC00]">Solopharma Group, s.r.o</p>
        <p>Number: +420 797 837 856</p>
        <p>Email: oshchepkova.solar@gmail.com</p>
        <p>
          Adress: Na Lysinách 551/34,
          <br /> Praha 4 - Hodkovičky, PSČ 147 00
        </p>
      </div>
    </div>
  );
};

export default Footer;
