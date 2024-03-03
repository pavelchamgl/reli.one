import React from 'react';
import online_marketplace from '../assets/7.png';

const Vase_pohodli = () => {
  return (
    <div className="flex rounded-2xl bg-white pr-4 pt-4">
      <img
        src={online_marketplace}
        className="h-full max-w-[160px] xl:max-w-[250px]"
        alt=""
      />
      <div className="flex flex-col justify-center">
        <p className="font-bold leading-[125%] xl:text-2xl">Vaše pohodlí</p>
        <p className="mt-5 text-[9px] font-semibold leading-[160%] xl:text-sm">
          Partnerství s námi je pohodlné, protože můžete svou firmu přenést
          online, aniž byste museli vytvářet webové stránky a propagovat je
        </p>
      </div>
    </div>
  );
};

export default Vase_pohodli;
