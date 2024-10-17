import { Drawer } from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import { styled, Slider, SliderThumb } from "@mui/material";
import { useTranslation } from "react-i18next";

import filterIcon from "../../assets/mobileIcons/filterIcon.svg";
import populFilterIcon from "../../assets/mobileIcons/populariteFilterIcon.svg";
import selectIcon from "../../assets/mobileIcons/selectIcon.svg";

import styles from "./MobFilter.module.scss";
import { useLocation } from "react-router-dom";

const AirbnbSlider = styled(Slider)(({ theme }) => ({
  color: "#000000",
  height: 3,
  padding: "13px 0",
  "& .MuiSlider-thumb": {
    height: 27,
    width: 27,
    backgroundColor: "#fff",
    border: "1px solid currentColor",
    "&:hover": {
      boxShadow: "0 0 0 8px rgba(0, 0, 0, 0.16)",
    },
    "& .airbnb-bar": {
      height: 9,
      width: 1,
      backgroundColor: "currentColor",
      marginLeft: 1,
      marginRight: 1,
    },
  },
  "& .MuiSlider-track": {
    height: 3,
  },
  "& .MuiSlider-rail": {
    color: theme.palette.mode === "dark" ? "#bfbfbf" : "#d8d8d8",
    opacity: theme.palette.mode === "dark" ? undefined : 1,
    height: 3,
  },
}));

function AirbnbThumbComponent(props) {
  const { children, ...other } = props;
  return (
    <SliderThumb {...other}>
      {children}
      <span className="airbnb-bar" />
      <span className="airbnb-bar" />
      <span className="airbnb-bar" />
    </SliderThumb>
  );
}

const MobFilter = ({
  setOrderingState = null,
  setOrdering = null,
  handleFilter,
  filter,
  setMax,
  setMin,
  products,
}) => {
  const [priceOpen, setPriceOpen] = useState(false);
  const [populOpen, setPopulOpen] = useState(false);
  const [value, setValue] = useState([0, 1.35]);
  const [selected, setSelected] = useState("rating");
  const { pathname } = useLocation();

  const { t } = useTranslation();

  const modalRef = useRef(null);

  const handleSliderChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleMinChange = (event) => {
    const newValue = [Math.min(event.target.value, value[1]), value[1]];
    setValue(newValue);
  };

  const handleMaxChange = (event) => {
    const newValue = [value[0], Math.max(event.target.value, value[0])];
    setValue(newValue);
  };

  const handleSelect = (option) => {
    setSelected(option);
    setPopulOpen(false);
  };

  const applyFilter = () => {
    console.log("Фильтр применен с ценами от", value[0], "до", value[1]);
    // Здесь можно добавить логику для применения фильтра
    setMin(value[0]);
    setMax(value[1]);
    handleFilter(!filter);
  };

  useEffect(() => {
    if (setOrdering) {
      // if (pathname === "/liked") {
      if (selected === "rating") {
        setOrderingState("popular");
        setOrdering("popular");
      }
      if (selected === "price") {
        setOrderingState("price_asc");
        setOrdering("price_asc");
      }
      if (selected === "-price") {
        setOrderingState("price_desc");
        setOrdering("price_desc");
      }
      // } else {
      //   setOrderingState(selected);
      //   setOrdering(selected);
      // }
    }
  }, [selected]);

  useEffect(() => {
    let max = 0;
    if (products && products.length > 0) {
      products?.forEach((item) => {
        if (Number(item?.price) > max) {
          max = Number(item?.price);
        }
      });
    }
    setValue([0, max]);
  }, [products]);

  return (
    <div>
      <div className={styles.btnDiv}>
        {pathname === "/liked" ? (
          <div></div>
        ) : (
          <button onClick={() => setPriceOpen(true)}>
            <img src={filterIcon} alt="" />
            <p>{t("filters")}</p>
          </button>
        )}
        <button onClick={() => setPopulOpen(true)}>
          <p>{t("popularity")}</p>
          <img src={populFilterIcon} alt="" />
        </button>
      </div>

      <Drawer
        anchor="bottom"
        open={priceOpen}
        onClose={() => setPriceOpen(false)}
      >
        <div ref={modalRef} className={styles.priceFilter}>
          <AirbnbSlider
            getAriaLabel={(index) =>
              index === 0 ? "Minimum price" : "Maximum price"
            }
            value={value}
            onChange={handleSliderChange}
            min={0}
            max={1000}
            step={10}
          />
          <div className="price-inputs">
            <div className="price-input">
              <label>{t("min_price")}</label>
              <input
                type="number"
                min="0"
                max="1.35"
                step="0.01"
                value={value[0]}
                onChange={handleMinChange}
              />
            </div>
            <div className="price-separator">-</div>
            <div className="price-input">
              <label>{t("max_price")}</label>
              <input
                type="number"
                min="0"
                max="1.35"
                step="0.01"
                value={value[1]}
                onChange={handleMaxChange}
              />
            </div>
          </div>
          <button onClick={applyFilter} className="apply-button">
            {t("apply_filtr")}
          </button>
        </div>
      </Drawer>
      <Drawer
        anchor="bottom"
        open={populOpen}
        onClose={() => setPopulOpen(false)}
      >
        <div className={styles.main}>
          <p className={styles.populTitle}>{t("arrange")}</p>
          <button
            style={{
              backgroundColor: selected === "rating" ? "black" : "white",
            }}
            onClick={() => handleSelect("rating")}
            className={styles.btn}
          >
            <p className={selected === "rating" ? styles.textAct : ""}>
              {t("according_popularity")}
            </p>
            <img src={selectIcon} alt="" />
          </button>
          <button
            onClick={() => handleSelect("price")}
            style={{
              backgroundColor: selected === "price" ? "black" : "white",
            }}
            className={styles.btn}
          >
            <p className={selected === "price" ? styles.textAct : ""}>
              {t("rising_price")}
            </p>
            <img src={selectIcon} alt="" />
          </button>
          <button
            onClick={() => handleSelect("-price")}
            style={{
              backgroundColor: selected === "-price" ? "black" : "white",
            }}
            className={styles.btn}
          >
            <p className={selected === "-price" ? styles.textAct : ""}>
              {t("price_descending")}
            </p>
            <img src={selectIcon} alt="" />
          </button>
        </div>
      </Drawer>
    </div>
  );
};

export default MobFilter;
