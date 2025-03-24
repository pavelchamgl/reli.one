import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-scroll';

const Menu_links = ({ stateFunc }) => {

  const { t } = useTranslation()

  return (
    <div className="mt-12 flex flex-col gap-7 pl-6 pr-16 text-xl text-white">
      <div className="border-b-2 border-[#666666]">
        <button className="mb-7">
          <Link
            onClick={() => stateFunc()}
            activeClass="active"
            className="uppercase"
            to="Domu"
            spy={true}
            smooth={true}
            duration={500}>
            {t("home")}
          </Link>
        </button>
      </div>
      <div className="border-b-2 border-[#666666]">
        <button className="mb-7">
          <Link
            onClick={() => stateFunc()}
            activeClass="active"
            className="uppercase"
            to="Proc_Zrovna_Me"
            spy={true}
            smooth={true}
            duration={500}>
            {t("choose")}
          </Link>
        </button>
      </div>
      <div className="border-b-2 border-[#666666]">
        <button className="mb-7">
          <Link
            onClick={() => stateFunc()}
            activeClass="active"
            className="uppercase"
            to="Vacancies"
            spy={true}
            smooth={true}
            duration={500}>
            {t("jobsOpen")}
          </Link>
        </button>
      </div>
      <div className="border-b-2 border-[#666666]">
        <button className="mb-7">
          <Link
            onClick={() => stateFunc()}
            activeClass="active"
            className="uppercase"
            to="News"
            spy={true}
            smooth={true}
            duration={500}>
            {t("news")}
          </Link>
        </button>
      </div>
      <div>
        <button>
          <Link
            onClick={() => stateFunc()}
            activeClass="active"
            className="uppercase"
            to="Kontakt"
            spy={true}
            smooth={true}
            duration={500}>
            {t("contact")}
          </Link>
        </button>
      </div>
    </div>
  );
};

export default Menu_links;
