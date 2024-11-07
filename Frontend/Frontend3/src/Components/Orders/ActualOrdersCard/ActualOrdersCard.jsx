import { useEffect, useState } from "react";
import testImage from "../../../assets/Product/ProductTestImage.svg";
import { Link, useNavigate } from "react-router-dom";

import styles from "./ActualOrdersCard.module.scss";

const ActualOrdersCard = ({ item }) => {
  console.log(item);

  const [image, setImage] = useState(null);
  const [text, setText] = useState("");

  const navigate = useNavigate();

  // {
  //   product: {
  //     image: '/media/base_product_images/testImage.jpg',
  //     name: 'iPhone 13',
  //     product_description:
  //       'Latest iPhone model with a 6.1-inch display, dual-camera system, and A15 Bionic chip.'
  //   },
  //   quantity: 1,
  //   product_price: '999.00'
  // }

  useEffect(() => {
    if (item?.product_variant) {
      if (item?.product_variant?.image) {
        setImage(item?.product_variant?.image);
      }
      if (item?.product_variant?.text) {
        setText(item?.product_variant?.text);
      }
    }
  }, [item]);

  if (!item) {
    return <div></div>;
  } else {
    return (
      <div className={styles.main}>
        <div className={styles.imageDescWrap}>
          <img
            className={styles.img}
            src={image ? image : item?.product.image}
            alt={`${item?.product?.name}Img`}
            onClick={() => navigate(`/product/${item?.product?.id}`)}
          />
          <div className={styles.descDiv}>
            <Link className={styles.links} to={`/product/${item?.product?.id}`}>
              <p className={styles.prodName}>{item?.product?.name}</p>
            </Link>
            <p className={styles.prodDesc}>
              {item && text ? `${item?.product_variant?.name}: ${text}` : null}
            </p>
          </div>
        </div>
        <p className={styles.countPrice}>
          {item?.quantity} <span>x</span> <span>{item?.product_price} €</span>
        </p>
      </div>
    );
  }
};

export default ActualOrdersCard;
