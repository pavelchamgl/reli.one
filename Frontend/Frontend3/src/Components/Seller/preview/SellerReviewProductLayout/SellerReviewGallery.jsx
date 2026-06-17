import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "./SellerReviewProductLayout.module.scss";

const SellerReviewGallery = ({ images = [], productName }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [images.length]);

  const activeImage = images[activeIndex];
  const canNavigate = images.length > 1;

  const showPrevious = () => {
    setActiveIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  };

  const showNext = () => {
    setActiveIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  };

  return (
    <section className={styles.gallery} aria-label="Product images">
      <div className={styles.mainImageWrap}>
        {activeImage?.src ? (
          <img
            className={styles.mainImage}
            src={activeImage.src}
            alt={activeImage.alt || productName}
          />
        ) : (
          <div className={styles.imageEmpty}>No product images added</div>
        )}
        {canNavigate ? (
          <>
            <button
              className={`${styles.galleryArrow} ${styles.galleryArrowLeft}`}
              type="button"
              onClick={showPrevious}
              aria-label="Previous product image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className={`${styles.galleryArrow} ${styles.galleryArrowRight}`}
              type="button"
              onClick={showNext}
              aria-label="Next product image"
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className={styles.thumbnails}>
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={index === activeIndex ? styles.thumbnailActive : styles.thumbnail}
              onClick={() => setActiveIndex(index)}
              aria-label={`View product image ${index + 1}`}
            >
              <img src={image.src} alt={image.alt || `${productName} ${index + 1}`} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default SellerReviewGallery;
