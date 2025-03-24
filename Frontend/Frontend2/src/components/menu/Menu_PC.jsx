import React from 'react';
import { Link } from 'react-scroll';
import { t } from "i18next"

const Menu_PC = () => {
  return (
    <ul className="flex flex-wrap gap-12 font-medium">
      <li className="cursor-pointer rounded-full px-4 transition duration-300 ease-in-out hover:bg-[#333333] hover:text-white">
        <Link
          activeClass="active"
          className="test1"
          to="Domu"
          spy={true}
          smooth={true}
          duration={500}>
          {t("home")}
        </Link>
      </li>
      <li className="cursor-pointer rounded-full px-4 transition duration-300 ease-in-out hover:bg-[#333333] hover:text-white">
        <Link
          activeClass="active"
          className="test1"
          to="Proc_Zrovna_Me"
          spy={true}
          smooth={true}
          duration={500}>
          {t("choose")}
        </Link>
      </li>
      <li className="cursor-pointer rounded-full px-4 transition duration-300 ease-in-out hover:bg-[#333333] hover:text-white">
        <Link
          activeClass="active"
          className="test1"
          to="Vacancies"
          spy={true}
          smooth={true}
          duration={500}>
          {t("jobsOpen")}
        </Link>
      </li>
      <li className="cursor-pointer rounded-full px-4 transition duration-300 ease-in-out hover:bg-[#333333] hover:text-white">
        <Link
          activeClass="active"
          className="test1"
          to="News"
          spy={true}
          smooth={true}
          duration={500}>
          {t("news")}
        </Link>
      </li>
      <li className="cursor-pointer rounded-full px-4 transition duration-300 ease-in-out hover:bg-[#333333] hover:text-white">
        <Link
          activeClass="active"
          className="test1"
          to="Kontakt"
          spy={true}
          smooth={true}
          duration={500}>
          {t("contact")}
        </Link>
      </li>
    </ul>
  );
};

export default Menu_PC;
