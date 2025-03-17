import React, { useState } from "react";

import { Rating } from "@mui/material"

import ProdImageModal from "../Components/Product/ProdImageModal/ProdImageModal";
import categoryTestImg from "../assets/TestImg/testCategory.svg"

import styles from "../styles/Test.module.scss";
import Container from "../ui/Container/Container";



// ! карточка и четка новая


// const Card = () => {
//   return (
//     <div className={styles.card}>
//       <img src="https://i.pinimg.com/736x/ed/8a/00/ed8a00c326baf894a6f86961350069f5.jpg" alt="" />
//       <div className={styles.descWrap}>
//         <p className={styles.price}>700p</p>
//         <p className={styles.name}>Lorem ipsum dolor, sit amet const adipisicing elit. Neque, quia! Optio porro voluptatem labore a quidem, non architecto minima repellendus quis praesentium blanditiis soluta ipsum autem ullam placeat doloremque suscipit?</p>
//         <div className={styles.rateDiv}>
//           <Rating size="small" value={5} />
//           <p>5</p>
//         </div>
//         <button className={styles.btn}>
//           Buy
//         </button>
//       </div>
//     </div>
//   )
// }


// const BarChart = () => {
//   const [open, setOpen] = useState(false)

//   const handleClose = () => {
//     setOpen(false)
//   }

//   return (
//     <div className={styles.cardWrap}>
//       <Card />
//       <Card />
//       <Card />
//       <Card />
//       {/* <button onClick={() => setOpen(!open)}>
//         open
//       </button> */}
//       <Card />
//       <Card />
//       <Card />
//       <Card />
//       <ProdImageModal open={open} handleClose={handleClose} />
//     </div>
//   );
// };

// export default BarChart;


const CategoryCard = () => {
  return (
    <div className={styles.categoryCard} style={{backgroundImage:`url(${"http://reli.one/media/category_images/00133-2682337464_2_6k9EuLc.png"})`}}>
      <p>name</p>
    </div>
  )
}


const CategoryWrap = () => {
  return (
    <Container>
      <div className={styles.categoryWrap}>
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        <CategoryCard />
        {/* <CategoryCard /> */}
      </div>
    </Container>
  )
}

export default CategoryWrap