import React from 'react';
import lang_learning from '../assets/4.png';
import { useTranslation } from 'react-i18next';

const Rozmanitost = () => {

  const { t } = useTranslation()

  return (
    <div className="flex rounded-2xl bg-white py-3 pr-4">
      <div>
        <img
          src={lang_learning}
          className="max-w-[160px] xl:max-w-[250px]"
          alt=""
        />
      </div>
      <div className="flex flex-col justify-center">
        <p className="font-bold leading-[125%] xl:text-2xl">
          {t("diversity")}
        </p>
        <p className="mt-5 text-[9px] font-semibold leading-[160%] xl:text-sm">
          {t("diversityText")}
        </p>
      </div>
    </div>
  );
};

export default Rozmanitost;
