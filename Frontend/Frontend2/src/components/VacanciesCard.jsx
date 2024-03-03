import React from 'react';

const VacanciesCard = (props) => {
  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-7">
      <p className="mb-7 font-semibold">{props.title}</p>
      <p className="line-clamp-1 font-medium">{props.content}</p>
      <button className="mt-12">Vazba</button>
    </div>
  );
};

export default VacanciesCard;
