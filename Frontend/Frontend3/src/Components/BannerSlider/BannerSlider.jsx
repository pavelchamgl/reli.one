import { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel, Keyboard, Autoplay } from "swiper/modules";
import { useMediaQuery } from "react-responsive";
import { Link, useNavigate } from "react-router-dom";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import unmute from "../../assets/player/unmute.svg"
import mute from "../../assets/player/mute.svg"
import play from "../../assets/player/play.svg"
import stop from "../../assets/player/stop.svg"
import arrowIcon from "../../assets/Product/detalImgSwiper.svg";

import styles from "./BannerSlider.module.scss";
import { getBannerImg } from "../../api/banner/banner";
import Spinner from "../../ui/Spiner/Spiner";


const BannerSlider = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const paginationRef = useRef(null);
  const videoRefs = useRef([]);
  const [swiperReady, setSwiperReady] = useState(false);
  const [videoStates, setVideoStates] = useState({});
  const [loading, setLoading] = useState(true)

  const isMobile = useMediaQuery({ maxWidth: 500 })

  const [images, setImages] = useState(
    [
      {
        image_url: "https://videos-5pe8.vercel.app/videos/1230%D0%A5400.mp4",
      }
    ]
  )


  useEffect(() => {
    setSwiperReady(true);
    setLoading(true);

    getBannerImg()
      .then((res) => {
        if (res.status === 200) {
          setImages([
            ...res.data,
            {
              image_url: "https://videos-5pe8.vercel.app/videos/1230%D0%A5400.mp4"
            }
          ]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      const initStates = {};
      images.forEach((_, i) => {
        initStates[i] = { paused: true, muted: true, volume: 0.5 };
      });
      setVideoStates(initStates);
    }
  }, [images]);



  const isImage = (url) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
  const isVideo = (url) => /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
  const isButtonSlide = (url) => url === "button"

  const navigate = useNavigate()

  const togglePlay = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video.play();
      setVideoStates((prev) => ({
        ...prev,
        [index]: { ...prev[index], paused: false },
      }));
    } else {
      video.pause();
      setVideoStates((prev) => ({
        ...prev,
        [index]: { ...prev[index], paused: true },
      }));
    }
  };

  const toggleMute = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    video.muted = !video.muted;
    setVideoStates((prev) => ({
      ...prev,
      [index]: { ...prev[index], muted: video.muted },
    }));
  };

  const setVolume = (index, value) => {
    const video = videoRefs.current[index];
    if (!video) return;

    video.volume = value;
    setVideoStates((prev) => ({
      ...prev,
      [index]: { ...prev[index], volume: value },
    }));
  };

  if (loading) {
    return (
      <div className={styles.swiperContainer}>
        <Spinner size="6px" />
      </div>
    )
  } else {
    return (
      <div className={styles.swiperContainer}>
        <div ref={prevRef} className={styles.swiperButtonPrev}>
          <img src={arrowIcon} alt="prev" />
        </div>
        <div ref={nextRef} className={styles.swiperButtonNext}>
          <img src={arrowIcon} className={styles.left} alt="next" />
        </div>
        <div ref={paginationRef} className={styles.swiperPagination}></div>

        {swiperReady && (
          <Swiper
            slidesPerView={1}
            spaceBetween={10}
            slidesPerGroup={1}
            loop={true}
            mousewheel={true}
            keyboard={true}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            autoplay={{
              delay: 6000, // работает только для картинок
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              el: paginationRef.current,
              clickable: true,
              bulletActiveClass: styles.paginationActive,
            }}
            modules={[Navigation, Pagination, Mousewheel, Keyboard, Autoplay]}
            className={styles.swiper}
            onSwiper={(swiper) => {
              setTimeout(() => {
                swiper.navigation.init();
                swiper.navigation.update();
                swiper.pagination.init();
                swiper.pagination.update();
              });

              swiper.on("slideChange", () => {
                const realIndex = swiper.realIndex;
                const activeSlide = images[realIndex];

                if (isVideo(activeSlide?.image_url)) {
                  swiper.autoplay.stop();

                  const video = videoRefs.current[realIndex];
                  if (video) {
                    video.currentTime = 0;
                    video.muted = true;
                    video.play()
                      .then(() => {
                        setVideoStates((prev) => ({
                          ...prev,
                          [realIndex]: { ...prev[realIndex], paused: false },
                        }));
                      })
                      .catch(() => { });

                    video.onpause = () => {
                      setVideoStates((prev) => ({
                        ...prev,
                        [realIndex]: { ...prev[realIndex], paused: true },
                      }));
                    };
                    video.onplay = () => {
                      setVideoStates((prev) => ({
                        ...prev,
                        [realIndex]: { ...prev[realIndex], paused: false },
                      }));
                    };

                    video.onended = () => {
                      swiper.slideNext();
                      swiper.autoplay.start();
                    };
                  }
                } else {
                  swiper.autoplay.start();

                  // стопаем все видео
                  videoRefs.current.forEach((video, index) => {
                    if (video) {
                      video.pause();
                      video.currentTime = 0;
                      setVideoStates((prev) => ({
                        ...prev,
                        [index]: { ...prev[index], paused: true },
                      }));
                    }
                  });
                }
              });



            }}
          >
            {images.map((item, index) => (
              <SwiperSlide key={index} className={styles.swiperSlide}>
                {isImage(item?.image_url) ? (
                  // ? настроил переход на страницу и отображение другой картинки на мобилке
                  // <Link to={"/products-seller/3"}>
                    <img
                      // onClick={() => navigate("/liked")}
                      // src={isMobile ? "https://i.pinimg.com/736x/35/47/69/354769a6c144b2d298f2acf91849981f.jpg" : }
                      src={item?.image_url}
                      alt={`img-${index}`}
                      className={styles.bannerImg}
                    />
                  {/* </Link> */}
                ) : isVideo(item?.image_url) ? (
                  <div className={styles.videoWrapper}>
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      src={item.image_url}
                      autoPlay
                      muted
                      playsInline
                      className={styles.bannerVideo}
                    />
                    <div className={styles.videoControls}>
                      <button onClick={() => togglePlay(index)}>
                        <img
                          src={videoStates[index]?.paused ? play : stop}
                          alt={videoStates[index]?.paused ? "Play" : "Stop"}
                        />
                      </button>

                      {
                        isMobile ?
                          <div className={styles.noiseControl}>
                            <button onClick={() => toggleMute(index)}>
                              <img
                                src={videoStates[index]?.muted ? mute : unmute}
                                alt={videoStates[index]?.muted ? "Muted" : "Unmuted"}
                              />
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={videoStates[index]?.volume ?? 0.5}
                              onChange={(e) =>
                                setVolume(index, parseFloat(e.target.value))
                              }
                            />
                          </div>
                          :
                          (
                            <>
                              <button onClick={() => toggleMute(index)}>
                                <img
                                  src={videoStates[index]?.muted ? mute : unmute}
                                  alt={videoStates[index]?.muted ? "Muted" : "Unmuted"}
                                />
                              </button>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={videoStates[index]?.volume ?? 0.5}
                                onChange={(e) =>
                                  setVolume(index, parseFloat(e.target.value))
                                }
                              />
                            </>
                          )

                      }

                    </div>
                  </div>
                ) : (
                  <div className={styles.buttonSlide} style={{ backgroundImage: `url(${"https://i.pinimg.com/1200x/30/ce/7d/30ce7d788a7b25e0b70cacca7272f063.jpg"})` }}>
                    <button onClick={() => navigate("/liked")}>
                      Click
                    </button>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    );
  }
}




export default BannerSlider;
