import { useEffect, useRef, useState } from "react";
import { useActionPayment } from "../../../hook/useActionPayment";

const PacketaWidget = ({ open, setOpen, sellerId, setIsNotChoose }) => {
    const [selectedPoint, setSelectedPoint] = useState(null);

    const { setPointInfo } = useActionPayment()

    useEffect(() => {
        // Загружаем скрипт виджета один раз при монтировании
        const script = document.createElement("script");
        script.src = "https://widget.packeta.com/www/js/library.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    const hasChosenPointRef = useRef(false); // вне функции

    const handleOpenWidget = () => {
        if (!window?.Packeta?.Widget) {
            console.warn("Виджет ещё не загружен");
            return;
        }

        const packetaApiKey = "197fd6840f332ccf";
        const packetaOptions = {
            language: "en",
            valueFormat: '"Packeta",id,carrierId,carrierPickupPointId,name,city,street',
            view: "modal",
            vendors: [
                { country: "cz" },
                { country: "hu" },
                { country: "sk" },
                { country: "ro" },
                { country: "cz", group: "zbox" },
                { country: "sk", group: "zbox" },
                { country: "hu", group: "zbox" },
                { country: "pl" },
                { country: "ro", group: "zbox" },
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
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (open) {
            handleOpenWidget();
        }
    }, [open]);

    return (
        <div>
            {selectedPoint && (
                <></>
                // <div className="mt-2 p-4 border rounded">
                //     <p><strong>{selectedPoint.name}</strong></p>
                //     <p>{selectedPoint.street}, {selectedPoint.city}</p>
                //     <p>Код пункта: <strong>{selectedPoint.id}</strong></p>
                // </div>
            )}
        </div>
    );
};

export default PacketaWidget;