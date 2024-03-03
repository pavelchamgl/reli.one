import React from 'react';

const Slogan = () => {
  return (
    <>
      <div className="text-[22px] font-bold lg:hidden">
        <p className="font-bold leading-10">
          Náš marketplace propojuje kupující a prodávající
        </p>
        <p className="inline-block rounded-bl-xl rounded-tr-xl bg-[#333333] px-2 py-1 text-[#FFCC00]">
          z celého světa.
        </p>
      </div>
      <div className="hidden font-bold lg:block">
        <p className="px-6 text-[52px]">Náš marketplace propojuje</p>
        <p className="inline-block rounded-bl-3xl rounded-tr-3xl bg-[#333333] px-6 py-1 text-[44px] text-[#F9C700]">
          kupující a prodávající z celého světa.
        </p>
      </div>
    </>
  );
};

export default Slogan;
