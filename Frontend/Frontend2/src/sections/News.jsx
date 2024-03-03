import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import NewsCard from '../components/NewsCard';
import OpennedNewsCard from '../components/OpennedNewsCard';

const News = () => {
  const [data, setData] = useState([]);
  const [openCardNum, setOpenCardNum] = useState(0);
  const [openinCard, setOpeninCard] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('http://localhost:8081/api/news/');
      const result = await response.json();
      setData(result);
    };
    fetchData();
  }, []);

  const openCard = (id) => {
    console.log(`Card ${id} is opened`);
    setOpeninCard(!openinCard);
    setOpenCardNum(id - 1);
  };
  const settings = {
    dots: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    speed: 500,
    infinite: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
    ],
  };
  return (
    <div className="bg-[#FFFDF7]">
      <div
        className="relative px-7 pb-14 pt-8 xl:mx-auto xl:max-w-[1439px] xl:px-32 xl:pt-12"
        id="News">
        {openinCard && (
          <OpennedNewsCard
            data={data[openCardNum]}
            openState={openinCard}
            toggleOpen={setOpeninCard}
          />
        )}
        <p className="text-2xl font-bold xl:text-6xl">Aktuality</p>
        <Slider {...settings} className="mt-7 xl:mt-16">
          {data.map((item) => (
            <NewsCard
              key={item.id}
              id={item.id}
              title={item.title}
              content={item.content}
              image={item.image[0].image}
              openCard={openCard}
            />
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default News;
