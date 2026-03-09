import { useMemo, useRef, useState } from "react";
import InputMask from "react-input-mask";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import dateIc from "../../../../../assets/Seller/register/dateIc.svg";

import { Popper, Paper, ClickAwayListener, IconButton } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

import styles from "./SellerDateInp.module.scss";

dayjs.extend(customParseFormat);

const greenTheme = createTheme({
  palette: {
    primary: { main: "#3f7f6d" },
  },
});

const SellerDateInp = ({ formik }) => {

  console.log(formik.values);
  

  const masks = "99.99.9999";

  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const showError = Boolean(
    formik.touched.date_of_birth && formik.errors.date_of_birth
  );

  const calendarValue = useMemo(() => {
    const parsed = dayjs(formik.values.date_of_birth, "DD.MM.YYYY", true);
    return parsed.isValid() ? parsed : null;
  }, [formik.values.date_of_birth]);

  const setDOB = (text) => {
    formik.setFieldValue("date_of_birth", text, true); // true -> сразу валидировать
    formik.setFieldTouched("date_of_birth", true, false);
  };

  return (
    <div className={styles.dateWrap}>
      <p className={styles.dateTitle}>Date of birth</p>

      <div className={`${styles.inpWrap} ${showError ? styles.error : ""}`}>
        <IconButton
          ref={anchorRef}
          onClick={() => setOpen((p) => !p)}
          size="small"
          sx={{ p: 0.5 }}
          aria-label="open calendar"
        >
          <img src={dateIc} alt="" />
        </IconButton>

        <InputMask
          mask={masks}
          maskChar=""
          alwaysShowMask={false}
          placeholder="dd.mm.yyyy"
          value={formik.values.date_of_birth || ""}
          name="date_of_birth"
          onChange={(e) => {
            // чтобы Formik корректно трекал value
            formik.handleChange(e);
          }}
          onBlur={formik.handleBlur}
        >
          {(inputProps) => (
            <input className={styles.input} {...inputProps} type="tel" />
          )}
        </InputMask>
      </div>

      {showError ? (
        <p className={styles.errorText}>{formik.errors.date_of_birth}</p>
      ) : null}

      <ThemeProvider theme={greenTheme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Popper
            open={open}
            anchorEl={anchorRef.current}
            placement="bottom-start"
            style={{ zIndex: 1300 }}
          >
            <ClickAwayListener onClickAway={() => setOpen(false)}>
              <Paper elevation={6} sx={{ p: 1, borderRadius: 2 }}>
                <DateCalendar
                  value={calendarValue}
                  onChange={(newVal) => {
                    if (!newVal) return;
                    setDOB(dayjs(newVal).format("DD.MM.YYYY"));
                    setOpen(false);
                  }}
                />
              </Paper>
            </ClickAwayListener>
          </Popper>
        </LocalizationProvider>
      </ThemeProvider>
    </div>
  );
};

export default SellerDateInp;