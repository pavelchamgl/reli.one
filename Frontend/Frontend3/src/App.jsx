import "./App.css";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deselectAllProducts } from "./redux/basketSlice";
import { useActionPayment } from "./hook/useActionPayment";

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const basket = useSelector((state) => state.basket.basket);

  const { setPageSection } = useActionPayment()

  useEffect(() => {
    const currentPath = location.pathname;

    // Если текущий путь не является "basket", "payment" или "mob_basket", снимаем выделение
    if (
      currentPath !== "/basket" &&
      currentPath !== "/payment" &&
      currentPath !== "/mob_basket"
    ) {
      dispatch(deselectAllProducts());
    }
  }, [location]);

  useEffect(() => {
    const currentPath = location.pathname;

    // Если текущий путь не является "basket", "payment" или "mob_basket", снимаем выделение
    if (
      currentPath !== "/payment"
    ) {
      setPageSection(1)
    }
  }, [location]);

  return <></>;
}

export default App;
