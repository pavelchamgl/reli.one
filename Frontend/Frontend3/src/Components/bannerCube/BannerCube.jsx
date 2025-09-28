import { Link } from "react-router-dom";

// SCSS модуль
import styles from "./BannerCube.module.scss";

export default function BannerCube() {
  return (
    <Link to="https://info.reli.one/" className={styles.wrapper}>
      <video
        className={styles.video}
        src="https://videos-wliz.vercel.app/videos/videoZagl.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
    </Link>
  );
}
