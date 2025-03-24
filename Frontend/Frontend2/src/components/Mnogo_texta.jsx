import React from 'react';

import { useTranslation } from 'react-i18next';

const Mnogo_texta = () => {

  const { t } = useTranslation()

  return (
    <div className="mt-8 lg:mt-12">
      <p className="text-sm font-medium leading-[160%] lg:mx-6 lg:max-w-[790px] lg:text-[26px]">
        {t("manyText")}
      </p>
    </div>
  );
};

export default Mnogo_texta;
