import React from 'react';
import techny_segment from '../assets/1.png';

const Hodne_Zakazniku = () => {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white p-4 xl:max-w-[360px]">
      <div>
        <img
          src={techny_segment}
          className="h-full max-w-[200px] xl:max-w-[280px]"
          alt=""
        />
      </div>
      <div className="xl:px-8">
        <p className="text-center text-xl font-bold xl:text-2xl">
          Hodně zákazníků
        </p>
        <p className="mb-7 mt-5 text-center text-xs font-semibold xl:text-base">
          Umístěním svých produktů na náš marketplace získáte přístup k širokému
          a rozmanitému publiku potenciálních zákazníků, zvýšíte viditelnost své
          značky a prodejní potenciál
        </p>
      </div>
    </div>
  );
};

export default Hodne_Zakazniku;
