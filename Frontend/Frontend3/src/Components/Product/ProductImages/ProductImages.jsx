import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import styles from "./ProductImages.module.scss";
import ProdImageModal from "../ProdImageModal/ProdImageModal";

const ProductImages = () => {
  const product = useSelector((state) => state.products.product);

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [image, setImage] = useState("");

  const [src1, setSrc1] = useState("");
  const [src2, setSrc2] = useState("");
  const [src3, setSrc3] = useState("");

  useEffect(() => {
    if (product?.images?.length > 0) {
      setImage(product?.images[0]?.image_url);
      setSrc1(product?.images[0]?.image_url);
      setSrc2(product?.images[1]?.image_url);
      setSrc3(product?.images[2]?.image_url);
      // setImage("https://i.pinimg.com/564x/cb/2d/a9/cb2da9b8e06f5e2addc04d92d9fb64a1.jpg");
      // setSrc1("https://i.pinimg.com/564x/dd/af/be/ddafbecd3f250a6dcbdb7ae4670035ec.jpg");
      // setSrc2("https://i.pinimg.com/564x/22/e5/d6/22e5d6c5a18581f89bc97140674798cd.jpg");
      // setSrc3(product.images[3]);
    }
  }, [product]);

  return (
    <div className={styles.main}>
      {image && (
        <img onClick={() => setIsModalOpen(true)} className={styles.mainImage} src={image} alt="Main product" />
      )}
      <div className={styles.smallImageDiv}>
        {src1 && (
          <button className={styles.smallImage} onClick={() => setImage(src1)}>
            <img src={src1} alt="Thumbnail 1" />
          </button>
        )}
        {src2 && (
          <button className={styles.smallImage} onClick={() => setImage(src2)}>
            <img src={src2} alt="Thumbnail 2" />
          </button>
        )}
        {src3 && (
          <button className={styles.smallImage} onClick={() => setImage(src3)}>
            <img src={src3} alt="Thumbnail 3" />
          </button>
        )}
      </div>

      <ProdImageModal open={isModalOpen} handleClose={() => setIsModalOpen(false)} imageUrl={product?.images} />
    </div>
  );
};

export default ProductImages;
