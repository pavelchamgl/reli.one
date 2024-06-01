import React, { useState, useRef, useEffect } from "react";
import { styled, Slider, SliderThumb } from "@mui/material";
import arrTop from "../../assets/Filter/arrTop.svg";
import arrBottom from "../../assets/Filter/arrBottom.svg";

import "./FilterByPrice.scss";

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

const FilterByPrice = () => {
  const [value, setValue] = useState([0, 1.35]);
  const [open, setOpen] = useState(false);
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

  const applyFilter = () => {
    console.log("Фильтр применен с ценами от", value[0], "до", value[1]);
    // Здесь можно добавить логику для применения фильтра
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="price-filter_main">
      <button onClick={() => setOpen(!open)} className="btnFilter">
        <p>Velikost</p>
        <img src={open ? arrTop : arrBottom} alt="" />
      </button>
      <div ref={modalRef} className={open ? "price-filter" : "price-filter_hid"}>
        <AirbnbSlider
          getAriaLabel={(index) =>
            index === 0 ? "Minimum price" : "Maximum price"
          }
          value={value}
          onChange={handleSliderChange}
          min={0}
          max={1.35}
          step={0.01}
        />
        <div className="price-inputs">
          <div className="price-input">
            <label>min. cena</label>
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
            <label>max. cena</label>
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
        <button className="apply-button" onClick={applyFilter}>
          Použít filtr
        </button>
      </div>
    </div>
  );
};

export default FilterByPrice;
