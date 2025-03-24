import React from 'react';
import Cards from '../components/Cards';
import { useTranslation } from 'react-i18next';

const Proc_Zrovna_Me = () => {

  const { t } = useTranslation()

  return (
    <div className="bg-[#333333] ">
      <div
        className="px-7 pb-10 xl:mx-auto xl:max-w-[1439px] xl:px-32"
        id="Proc_Zrovna_Me">
        <p className="pb-10 pt-6 text-2xl font-bold text-white xl:pb-20 xl:pt-16 xl:text-5xl">
          {t("choose")}
        </p>
        <Cards />
      </div>
    </div>
  );
};

export default Proc_Zrovna_Me;
