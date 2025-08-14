import { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import unmute from "../../assets/player/unmute.svg"
import mute from "../../assets/player/mute.svg"
import play from "../../assets/player/play.svg"
import stop from "../../assets/player/stop.svg"

import styles from "./BannerSlider.module.scss";

import arrowIcon from "../../assets/Product/detalImgSwiper.svg";
import { useNavigate } from "react-router-dom";

const BannerSlider = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const paginationRef = useRef(null);
  const videoRefs = useRef([]);
  const [swiperReady, setSwiperReady] = useState(false);
  const [videoStates, setVideoStates] = useState({});

  useEffect(() => {
    setSwiperReady(true);
  }, []);

  const images = [
    "https://i.pinimg.com/736x/e1/89/a4/e189a4788d1139978ef4a8d2c7244682.jpg",
    "https://videos.pexels.com/video-files/857195/857195-hd_1280_720_25fps.mp4",
    "https://i.pinimg.com/736x/33/9d/b7/339db75e3f90b69c3923d0644f9486c0.jpg",
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "button"
  ];

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
          loop={false}
          mousewheel={true}
          keyboard={true}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          pagination={{
            el: paginationRef.current,
            clickable: true,
            bulletActiveClass: styles.paginationActive,
          }}
          modules={[Navigation, Pagination, Mousewheel, Keyboard]}
          className={styles.swiper}
          onSwiper={(swiper) => {
            setTimeout(() => {
              swiper.navigation.init();
              swiper.navigation.update();
              swiper.pagination.init();
              swiper.pagination.update();
            });

            swiper.on("slideChangeTransitionStart", () => {
              const videos = document.querySelectorAll(`.${styles.bannerVideo}`);
              videos.forEach((video, index) => {
                video.pause();
                video.currentTime = 0;
                video.muted = true;

                setVideoStates((prev) => ({
                  ...prev,
                  [index]: { paused: true, muted: true, volume: 0.5 },
                }));
              });
            });
          }}
        >
          {images.map((item, index) => (
            <SwiperSlide key={index} className={styles.swiperSlide}>
              {isImage(item) ? (
                <img
                  src={item}
                  alt={`img-${index}`}
                  className={styles.bannerImg}
                />
              ) : isVideo(item) ? (
                <div className={styles.videoWrapper}>
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={item}
                    autoPlay
                    muted
                    loop={false}
                    playsInline
                    className={styles.bannerVideo}
                  />
                  <div className={styles.videoControls}>
                    <button onClick={() => togglePlay(index)}>
                      <img src={
                        videoStates[index]?.paused !== false ? play : stop
                      } alt="" />
                    </button>
                    <button onClick={() => toggleMute(index)}>
                      <img src={
                        videoStates[index]?.muted !== false ? mute : unmute
                      } alt="" />
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
};

export default BannerSlider;
