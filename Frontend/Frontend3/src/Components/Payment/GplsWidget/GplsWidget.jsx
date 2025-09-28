import { useEffect } from "react";
import { useActionPayment } from "../../../hook/useActionPayment";
import { useSelector } from "react-redux";

const GlsWidget = ({ open, setOpen, onSelect, setIsNotChoose, sellerId }) => {

    const { setPointInfo } = useActionPayment()

    const payment = useSelector(state => state.payment)



    useEffect(() => {
        if (!open) return;

        // Подключаем GLS скрипт один раз
        if (!document.getElementById("gls-script")) {
            const script = document.createElement("script");
            script.id = "gls-script";
            script.src = "https://ps-maps.gls-czech.com/widget/gls_psd_widget.js?v=2";
            script.async = true;
            document.body.appendChild(script);
        }

        // Ловим событие postMessage от GLS (когда пользователь выбрал пункт)
        const handleMessage = (event) => {
            if (!event.data?.parcelshop) {
                setIsNotChoose(true)
                return
            };

            const ps = event.data.parcelshop;

            const parcelShop = {
                id: ps.detail.pclshopid,
                name: ps.detail.name,
                street: ps.detail.address,
                city: ps.detail.city,
                zipcode: ps.detail.zipcode,
                country: ps.detail.ctrcode,
            };

            console.log("Выбранный ParcelShop:", parcelShop);
            setPointInfo(
                {
                    pickup_point_id: ps.detail.pclshopid,
                    country: ps.detail.ctrcode,
                    street: ps.detail.address,
                    city: ps.detail.city,
                    zip: ps.detail.zipcode,
                    sellerId
                }
            )
            onSelect(parcelShop);
            setOpen(false);
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [open, onSelect, setOpen]);

    if (!open) return null;

    return (
        <div>
            {/* <button onClick={() => window.findGlsPs()}>
        Vybrat GLS ParcelShop
      </button> */}

            {/* Эти скрытые поля нужны, чтобы GLS виджет работал корректно */}
            <input
                type="hidden"
                id="ctrcodeGls"
                value={payment?.country?.toUpperCase() || "SK"} // страна
            />
            <input
                type="hidden"
                id="zipcodeGls"
                value={payment?.paymentInfo?.zip || ""} // почтовый индекс
            />
            <input
                type="hidden"
                id="cityGls"
                value={payment?.paymentInfo?.city || ""} // город
            />
        </div>
    );
};

export default GlsWidget;
