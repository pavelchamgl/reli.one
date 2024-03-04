import React from 'react';
import { Link } from 'react-scroll';

const Menu_PC = () => {
  return (
    <ul className="flex flex-wrap gap-16 font-medium">
      <li className="cursor-pointer rounded-full px-4 transition duration-300 ease-in-out hover:bg-[#333333] hover:text-white">
        <Link
          activeClass="active"
          className="test1"
          to="Domu"
          spy={true}
          smooth={true}
          duration={500}>
          Domů
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
          Proč zrovna my?
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
          Volná pracovní místa
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
          Aktuality
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
          Kontakt
        </Link>
      </li>
    </ul>
  );
};

export default Menu_PC;
