import React, { useState } from 'react';
import SoloPharma_logo from '../assets/SoloPharma-logo.png';
import SoloPharma_logo_PC from '../assets/SoloPharma-logo-laptop.png';
import close_menu_button from '../assets/close_menu_button.png';
import Menu_button from './menu/Menu_button';
import Menu_PC from './menu/Menu_PC';
import Portal_menu from './Portal_menu';
import Menu_links from './menu/Menu_links';

const click_button = () => {
  console.log('click');
};

const Header = () => {
  const [openMenu, setOpenMenu] = useState(false);
  openMenu
    ? (document.body.style.overflow = 'hidden')
    : (document.body.style.overflow = 'auto');
  const changeState = () => {
    setOpenMenu(!openMenu);
  };
  return (
    <>
      {openMenu && (
        <Portal_menu>
          <div className="absolute top-0 h-[100vh] w-full bg-[#333333] p-7">
            <div className="flex justify-end">
              <button onClick={() => changeState()}>
                <img src={close_menu_button}></img>
              </button>
            </div>
            <Menu_links stateFunc={changeState} />
          </div>
        </Portal_menu>
      )}
      <div className="flex items-center justify-between pt-3 lg:justify-normal">
        <div className="lg:mr-20 xl:mr-32">
          <img
            src={SoloPharma_logo}
            className="h-ful w-full lg:hidden"
            alt=""
          />
          <img src={SoloPharma_logo_PC} className="hidden lg:block" alt="" />
        </div>
        <div className="lg:hidden">
          <button onClick={() => setOpenMenu(!openMenu)}>
            <Menu_button />
          </button>
        </div>
        <div className="hidden lg:block">
          <Menu_PC />
        </div>
      </div>
    </>
  );
};

export default Header;
