import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";
import { useActions } from "../../../hook/useAction";
import { useTranslation } from "react-i18next";

import testIcon from "../../../assets/Catalog/testImage.svg";
import arrRight from "../../../assets/Catalog/arrRight.svg";

import styles from "./CatalogItem.module.scss";

const CatalogItem = ({ data, handleClose }) => {
  const isMobile = useMediaQuery({ maxWidth: 426 });
  const navigate = useNavigate();
  console.log(data);

  const { setCategory } = useActions();


  const handleClick = () => {
    if (isMobile) {
      navigate("/mob_category");
      setCategory(data);
      handleClose();
    } else {
      setCategory(data);
    }
  };


  return (
    <button onClick={handleClick} className={styles.main}>
      <div>
        {data && data?.image_url && <img src={data?.image_url} alt="" />}
        <p>{data?.name}</p>
      </div>
      <button>
        <img src={arrRight} alt="" />
      </button>
    </button>
  );
};

export default CatalogItem;
