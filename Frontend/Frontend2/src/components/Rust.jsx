import React from 'react';
import stock_trading from '../assets/3.png';
import { useTranslation } from 'react-i18next';

const Rust = () => {

  const { t } = useTranslation()

  return (
    <div className="flex rounded-2xl bg-white pr-4">
      <div>
        <img
          src={stock_trading}
          className="max-w-[160px] xl:max-w-[250px]"
          alt=""
        />
      </div>
      <div className="flex flex-col justify-center">
        <p className="font-bold leading-[125%] xl:text-2xl">{t("growth")}</p>
        <p className="mt-5 text-[9px] font-semibold leading-[160%] xl:max-w-[400px] xl:text-base">
          {t("growthText")}
        </p>
      </div>
    </div>
  );
};

export default Rust;
