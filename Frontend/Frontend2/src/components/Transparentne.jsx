import React from 'react';
import cube from '../assets/6.png';
import { useTranslation } from 'react-i18next';

const Transparentne = () => {

  const { t } = useTranslation()

  return (
    <div className="flex rounded-2xl bg-white pr-4 pt-4">
      <img
        src={cube}
        className="h-full max-w-[160px] xl:max-w-[250px]"
        alt=""
      />
      <div className="flex flex-col justify-center">
        <p className="font-bold leading-[125%] xl:text-2xl">
          {t("everything")}
        </p>
        <p className="mt-5 text-[9px] font-semibold leading-[160%] xl:text-sm">
          {t("everythingText")}
        </p>
      </div>
    </div>
  );
};

export default Transparentne;
