import React from 'react';
import Hodne_Zakazniku from './Hodne_Zakazniku';
import Partnerstvi_s_nami from './Partnerstvi_s_nami';
import Rust from './Rust';
import Rozmanitost from './Rozmanitost';
import Vstupte_do_nas from './Vstupte_do_nas';
import Transparentne from './Transparentne';
import Vase_pohodli from './Vase_pohodli';

const Cards = () => {
  return (
    <div>
      <div className="flex flex-col gap-7 lg:flex-row">
        <Hodne_Zakazniku />
        <div className="flex w-full flex-col gap-7">
          <Partnerstvi_s_nami />
          <Rust />
        </div>
      </div>
      <div className="mt-7 grid grid-cols-1 gap-7 xl:grid-cols-2">
        <Rozmanitost />
        <Vstupte_do_nas />
        <Transparentne />
        <Vase_pohodli />
      </div>
    </div>
  );
};

export default Cards;
