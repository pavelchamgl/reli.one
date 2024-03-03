import React, { useEffect, useState } from 'react';
import VacanciesCard from '../components/VacanciesCard';
const Vacancies = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('http://localhost:8081/api/vacancies/');
      const result = await response.json();
      setData(result);
      console.log(result[0].id);
    };
    fetchData();
  }, []);
  return (
    <div className="px-7 py-10 xl:mx-auto xl:max-w-[1439px] xl:px-32 xl:py-12">
      <p className=" text-2xl font-bold xl:text-5xl">Volná pracovní místa</p>
      <div className="mt-7 grid grid-cols-1 gap-5 xl:mt-12 xl:grid-cols-2 xl:gap-10">
        {data.map((item) => (
          <VacanciesCard
            key={item.id}
            title={item.title}
            content={item.description}
          />
        ))}
      </div>
    </div>
  );
};

export default Vacancies;
