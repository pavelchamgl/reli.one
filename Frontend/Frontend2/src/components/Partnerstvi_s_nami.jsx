import React from 'react';
import techny_regulatory from '../assets/2.png';
import { useTranslation } from 'react-i18next';

const Partnerstvi_s_nami = () => {

  const { t } = useTranslation()

  return (
    <div className="flex rounded-2xl bg-white pr-4">
      <div className="">
        <img
          src={techny_regulatory}
          className="h-full max-w-[160px] xl:max-w-[250px] max-h-[160px] xl:max-h-none"
          alt=""
        />
      </div>
      <div className="flex w-full flex-col justify-center">
        <p className="font-bold leading-[125%] xl:text-2xl">
          {t("partnership")}
        </p>
        <p className="mt-5 text-[9px] font-semibold leading-[160%] xl:max-w-[400px] xl:text-base">
          {t("partnershipText")}
        </p>
      </div>
    </div>
  );
};

export default Partnerstvi_s_nami;
