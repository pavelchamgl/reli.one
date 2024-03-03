import React from 'react';
import close_menu_button from '../assets/close_menu_button.png';

const OpennedNewsCard = ({ data, openState, toggleOpen }) => {
  return (
    <div className="absolute left-0 top-0 z-10 h-full w-full xl:p-10">
      <div className="relative flex h-full flex-col gap-5 bg-[#F5F5F5] p-5 xl:rounded-2xl xl:p-14">
        <div className="flex justify-end">
          <button onClick={() => toggleOpen(!openState)}>
            <img src={close_menu_button} alt="" />
          </button>
        </div>
        <p className="font-semibold xl:text-[32px]">{data.title}</p>
        <div className="flex flex-col gap-5 xl:flex-row xl:gap-14 xl:p-10">
          <div className="xl:flex-1">
            <img
              src={data.image[0].image}
              className="aspect-video max-h-[300px] rounded-2xl object-cover"
              alt=""
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto xl:max-h-[300px] xl:flex-1">
            <p className="font-medium leading-[160%] xl:text-[24px] xl:font-normal">
              {data.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpennedNewsCard;
