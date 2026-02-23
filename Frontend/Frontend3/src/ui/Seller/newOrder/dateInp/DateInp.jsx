import { useMemo, useRef, useState } from "react";
import InputMask from "react-input-mask";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import dateIc from "../../../../assets/Seller/newOrder/dateIc.svg";
import styles from "./DateInp.module.scss";

import { useSelector } from "react-redux";
import { useActionNewOrder } from "../../../../hook/useActionNewOrder";

// MUI
import { Popper, Paper, ClickAwayListener, IconButton } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

dayjs.extend(customParseFormat);

const greenTheme = createTheme({
  palette: {
    primary: { main: "#3f7f6d" }, // зелёный (поменяй на свой)
  },
});

const DateInp = ({ title }) => {
  const masks = "99.99.9999";

  const { date_from, date_to } = useSelector((state) => state.newOrder);
  const { setDate } = useActionNewOrder();

  const isFrom = title === "Date From";
  const currentText = isFrom ? date_from : date_to;

  // popper state
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  // преобразуем строку "dd.mm.yyyy" -> dayjs (для подсветки текущей даты в календаре)
  const calendarValue = useMemo(() => {
    const parsed = dayjs(currentText, "DD.MM.YYYY", true);
    return parsed.isValid() ? parsed : null;
  }, [currentText]);

  const applyText = (text) => {
    setDate({
      type: isFrom ? "from" : "to",
      text,
    });
  };

  return (
    <div className={styles.dateWrap}>
      <p className={styles.dateTitle}>{title}</p>

      <div className={styles.inpWrap}>
        {/* ИКОНКА -> КНОПКА, чтобы удобно якорить Popper */}
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
          value={currentText}
          onChange={(e) => applyText(e.target.value)}
        >
          {(inputProps) => (
            <input className={styles.input} {...inputProps} type="tel" />
          )}
        </InputMask>

        {/* КАЛЕНДАРЬ */}
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
                      applyText(dayjs(newVal).format("DD.MM.YYYY"));
                      setOpen(false);
                    }}
                  />
                </Paper>
              </ClickAwayListener>
            </Popper>
          </LocalizationProvider>
        </ThemeProvider>
      </div>
    </div>
  );
};

export default DateInp;