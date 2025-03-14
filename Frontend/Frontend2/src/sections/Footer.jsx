import React from 'react';
import SoloPharma_footer_logo from '../assets/SoloPharma-footer-logo.png';
import ReliLogo from '../assets/Main logo white.svg'
import { Link } from 'react-scroll';

const Footer = () => {
  return (
    <div className="bg-[#333333]">
      <div className="py-10 text-white xl:mx-auto xl:flex xl:max-w-[1439px] xl:justify-between xl:px-32 xl:pt-10">
        <div className="mb-7 flex flex-col items-center gap-10 xl:mb-0">
          <p className="cursor-pointer">
            <Link
              activeClass="active"
              className="test1"
              to="Domu"
              spy={true}
              smooth={true}
              duration={500}>
              Domů
            </Link>
          </p>
          <p className="cursor-pointer">
            <Link
              activeClass="active"
              className="test1"
              to="Proc_Zrovna_Me"
              spy={true}
              smooth={true}
              duration={500}>
              Proč zrovna my?
            </Link>
          </p>
          <p className="cursor-pointer">
            {' '}
            <Link
              activeClass="active"
              className="test1"
              to="Vacancies"
              spy={true}
              smooth={true}
              duration={500}>
              Volná pracovní místa
            </Link>
          </p>
          <p className="cursor-pointer">
            <Link
              activeClass="active"
              className="test1"
              to="News"
              spy={true}
              smooth={true}
              duration={500}>
              Aktuality
            </Link>
          </p>
          <p className="cursor-pointer">
            <Link
              activeClass="active"
              className="test1"
              to="Kontakt"
              spy={true}
              smooth={true}
              duration={500}>
              Kontakt
            </Link>
          </p>
        </div>
        <div className="flex flex-col items-center justify-end gap-5">
          <img src={ReliLogo} className="w-[200px] mb-3" alt="" />
          <p className="text-xs">(c) Copyright 2025 Reli group</p>
        </div>
        <div className="hidden flex-col justify-between xl:flex">
          <p className="text-2xl text-[#FFCC00]">Reli Group, s.r.o</p>
          <p>Number: +420 797 837 856</p>
          <p>Email: info.reli.one@gmail.com</p>
          <p>
            Adress: Na Lysinách 551/34,
            <br /> Praha 4 - Hodkovičky, PSČ 147 00
          </p>
        </div>
      </div>
    </div>
  );
};

export default Footer;
