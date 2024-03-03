import React from 'react';

const Menu_links = () => {
  return (
    <div className="mt-12 flex flex-col gap-7 pl-6 pr-16 text-xl text-white">
      <div className="border-b-2 border-[#666666]">
        <button className="mb-7">
          <span className="uppercase">Domů</span>
        </button>
      </div>
      <div className="border-b-2 border-[#666666]">
        <button className="mb-7">
          <span className="uppercase">Proč zrovna my?</span>
        </button>
      </div>
      <div className="border-b-2 border-[#666666]">
        <button className="mb-7">
          <span className="uppercase">Volné místo</span>
        </button>
      </div>
      <div className="border-b-2 border-[#666666]">
        <button className="mb-7">
          <span className="uppercase">Aktuality</span>
        </button>
      </div>
      <div>
        <button>
          <span className="uppercase">Kontakt</span>
        </button>
      </div>
    </div>
  );
};

export default Menu_links;
