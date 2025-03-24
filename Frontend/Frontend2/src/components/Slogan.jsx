import React from 'react';

import { useTranslation } from 'react-i18next';

const Slogan = () => {

  const { t } = useTranslation()

  return (
    <>
      <div className="text-[22px] font-bold lg:hidden">
        <p className="font-bold leading-10">
          {t("aboutTitleBlack")}
        </p>
        <p className="inline-block rounded-bl-xl rounded-tr-xl bg-[#333333] px-2 py-1 text-[#FFCC00]">
          {t("aboutTitleYellow")}
        </p>
      </div>
      <div className="hidden font-bold lg:block">
        <p className="px-6 text-[52px]">{t("titleBlackPC")}</p>
        <p className="inline-block rounded-bl-3xl rounded-tr-3xl bg-[#333333] px-6 py-1 text-[44px] text-[#F9C700]">
          {t("titleYellowPC")}
        </p>
      </div>
    </>
  );
};

export default Slogan;
