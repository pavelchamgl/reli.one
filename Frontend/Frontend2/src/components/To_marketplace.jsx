import React from 'react';
import To_marketplace_button from '../assets/To_marketplace_button.png';
import Tmrk_button from '../assets/Tmrk_button.png';
import { useTranslation } from 'react-i18next';



const To_marketplace = () => {

  const { t } = useTranslation()

  return (
    <a href="https://reli.one">
      <div className="mt-8 inline-block rounded-br-xl rounded-tl-xl bg-[#333333] p-2 lg:rounded-br-3xl lg:rounded-tl-3xl lg:px-6 lg:py-3">
        <div className="flex items-center gap-3">
          <p className="text-[12px] font-semibold text-white lg:text-[26px]">
            {t("btnText")}
          </p>
          <div className="lg:hidden">
            <img src={To_marketplace_button} alt="" />
          </div>
          <div className="hidden lg:block">
            <img src={Tmrk_button} alt="" />
          </div>
        </div>
      </div>
    </a>
  );
};

export default To_marketplace;
