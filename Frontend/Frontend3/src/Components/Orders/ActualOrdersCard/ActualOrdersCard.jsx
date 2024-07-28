import testImage from "../../../assets/Product/ProductTestImage.svg";

import styles from "./ActualOrdersCard.module.scss";

const ActualOrdersCard = ({ item }) => {
  console.log(item);
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
  if (!item) {
    return <div></div>;
  } else {
    return (
      <div className={styles.main}>
        <div className={styles.imageDescWrap}>
          <img className={styles.img} src={testImage} alt="" />
          <div className={styles.descDiv}>
            <p className={styles.prodName}>{item?.product?.name}</p>
            <p className={styles.prodDesc}>
              {item?.product?.product_description?.slice(0, 25)}...
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
