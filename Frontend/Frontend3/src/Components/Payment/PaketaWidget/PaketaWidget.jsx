import { useEffect, useRef, useState } from "react";
import { useActionPayment } from "../../../hook/useActionPayment";
import { useSelector } from "react-redux";

const PacketaWidget = ({ open, setOpen, sellerId, setIsNotChoose }) => {
    const [selectedPoint, setSelectedPoint] = useState(null);
    const { setPointInfo } = useActionPayment();
    const payment = useSelector(state => state.payment);

    useEffect(() => {
        // Загружаем скрипт виджета один раз при монтировании
        const script = document.createElement("script");
        script.src = "https://widget.packeta.com/www/js/library.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    const hasChosenPointRef = useRef(false);

    const allowedCountries = ["cz", "sk", "ro", "hu"]; // ISO коды стран

    const handleOpenWidget = () => {
        if (!window?.Packeta?.Widget) {
            console.warn("Виджет ещё не загружен");
            return;
        }

        // Проверяем, входит ли выбранная страна в список разрешённых
        const currentCountry = payment?.country?.toLowerCase();
        if (!allowedCountries.includes(currentCountry)) {
            setOpen(false);
            return;
        }

        const packetaApiKey = "197fd6840f332ccf";
        const packetaOptions = {
            language: "en",
            valueFormat: '"Packeta",id,carrierId,carrierPickupPointId,name,city,street',
            view: "modal",
            vendors: [
                { country: currentCountry },
                { country: currentCountry, group: "zbox" },
            ],
            onClose: () => {
                if (!hasChosenPointRef.current) {
                    setIsNotChoose(true);
                    console.log("Не выбрали пункт");
                } else {
                    setIsNotChoose(false);
                    console.log("Выбран пункт, закрыли окно");
                }
                setOpen(false);
                hasChosenPointRef.current = false;
            },
        };

        const showSelectedPickupPoint = (point) => {
            if (point) {
                hasChosenPointRef.current = true;
                setSelectedPoint(point);
                console.log(point);

                setPointInfo({
                    pickup_point_id: point.id,
                    country: point.country,
                    street: point.street,
                    city: point.city,
                    zip: point.zip,
                    sellerId
                });


                
                setIsNotChoose(false);
            }
        };

        window.Packeta.Widget.pick(packetaApiKey, showSelectedPickupPoint, packetaOptions);
    };

    useEffect(() => {
        if (open) {
            handleOpenWidget();
        }
    }, [open]);

    return (
        <div>
            {selectedPoint && <></>}
        </div>
    );
};

export default PacketaWidget;
