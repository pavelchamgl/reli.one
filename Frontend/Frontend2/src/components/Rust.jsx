import React from 'react';
import stock_trading from '../assets/3.png';

const Rust = () => {
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
        <p className="font-bold leading-[125%] xl:text-2xl">Růst</p>
        <p className="mt-5 text-[9px] font-semibold leading-[160%] xl:max-w-[400px] xl:text-base">
          Růst spolu s námi! Naše plány na rozšíření platformy jsou v souladu s
          vašimi cíli růstu firmy
        </p>
      </div>
    </div>
  );
};

export default Rust;
