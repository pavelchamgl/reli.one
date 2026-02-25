import { useEffect, useState } from "react";
import styles from "./PreviewImages.module.scss"

const PreviewImage = ({ product }) => {
  const [image, setImage] = useState("");



  useEffect(() => {
    if (product?.images?.length > 0) {
      setImage(product?.images[0]?.image_url);

      // setImage(
      //   "https://i.pinimg.com/564x/cb/2d/a9/cb2da9b8e06f5e2addc04d92d9fb64a1.jpg"
      // );
      // setSrc1(
      //   "https://i.pinimg.com/564x/dd/af/be/ddafbecd3f250a6dcbdb7ae4670035ec.jpg"
      // );
      // setSrc2(
      //   "https://i.pinimg.com/564x/22/e5/d6/22e5d6c5a18581f89bc97140674798cd.jpg"
      // );
      // setSrc3(
      //   "https://i.pinimg.com/564x/22/e5/d6/22e5d6c5a18581f89bc97140674798cd.jpg"
      // );
    }
  }, []);

  return (
    <div className={styles.main}>
      {image && (
        <img className={styles.mainImage} src={image} alt="Main product" />
      )}
      <div className={styles.smallImageDiv}>
        {
          product?.images && product?.images?.length > 0 &&
          product.images.map((item) => (
            <button className={styles.smallImage} onClick={() => setImage(item?.image_url)}>
              <img src={item?.image_url} alt="Thumbnail 1" />
            </button>
          ))
        }
      </div>
    </div>
  );
};

export default PreviewImage;
