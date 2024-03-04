import React from 'react';

const NewsCard = (props) => {
  return (
    <div className="flex min-h-[460px] flex-col overflow-hidden rounded-2xl bg-[#F5F5F5]">
      <div className="max-h-[200px] overflow-hidden">
        <img src={props.image} className="h-full w-full object-cover" alt="" />
      </div>
      <div className="flex flex-1 flex-col justify-between px-7 py-5">
        <div>
          <p className="text-[13px] font-semibold xl:text-lg">{props.title}</p>
          <p className="mt-6 line-clamp-4 text-[11px] text-sm font-medium">
            {props.content}
          </p>
        </div>
        <div>
          <button>
            <span
              className="text-xs text-[#EABB01] xl:text-sm"
              onClick={() => {
                props.openCard(props.id);
              }}>
              Číst dále
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
