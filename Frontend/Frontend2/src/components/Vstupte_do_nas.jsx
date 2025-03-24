import React from 'react';
import project_management from '../assets/5.png';
import { useTranslation } from 'react-i18next';

const Vstupte_do_nas = () => {

  const { t } = useTranslation()

  return (
    <div className="flex rounded-2xl bg-white pr-4 pt-4">
      <img
        src={project_management}
        className="max-w-[160px] xl:max-w-[250px]"
        alt=""
      />
      <div className="flex flex-col justify-center">
        <p className="font-bold leading-[125%] xl:text-2xl">
          {t("join")}
        </p>
        <p className="mt-5 text-[9px] font-semibold leading-[160%] xl:text-sm">
          {t("joinText")}
        </p>
      </div>
    </div>
  );
};

export default Vstupte_do_nas;
