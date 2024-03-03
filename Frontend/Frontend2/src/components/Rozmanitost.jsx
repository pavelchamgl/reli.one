import React from 'react';
import lang_learning from '../assets/4.png';

const Rozmanitost = () => {
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
          Rozmanitost a interakce
        </p>
        <p className="mt-5 text-[9px] font-semibold leading-[160%] xl:text-sm">
          Naše platforma podporuje rozmanitost. Ukažte své jedinečné produkty a
          spojte se se zákazníky, které vaše nabídka zajímá
        </p>
      </div>
    </div>
  );
};

export default Rozmanitost;
