import React, { useEffect, useRef, useState } from 'react';

import { useTranslation } from "react-i18next"
import { useSelector } from 'react-redux';
import { useActionPayment } from '../../../hook/useActionPayment';
import { useMediaQuery } from "react-responsive"

function DpdPickupWidget({
    open,
    setOpen,
    sellerId,
    setIsNotChoose
}) {
    const iframeRef = useRef(null);

    const { i18n } = useTranslation()
    const lang = i18n.language

    const payment = useSelector(state => state.payment);
    const { setPointInfo } = useActionPayment();

    const isMobile = useMediaQuery({ maxWidth: 500 })



    // Параметры страны
    // const countriesParam = countryCodes.map(c =>`).join('&');
    const srcUrl = `https://api.dpd.cz/widget/latest/index.html?${`countries=${payment?.country}`}&${`lang=${lang}`}`;

    // Состояние, открыто ли окно

    const allowedCountries = ["cz", "de", "pl", "sk", "hr"]; // ISO коды стран


    // const [open, setOpen] = useState(false)

    useEffect(() => {
        const currentCountry = payment?.country?.toLowerCase();

        if (!allowedCountries.includes(currentCountry)) {
            setOpen(false);
            return;
        }

    }, [payment?.country]);

    useEffect(() => {
        function handleMessage(event) {
            // Проверяем, что сообщение от DPD виджета
            if (event.data.dpdWidget) {
                const widgetData = event.data.dpdWidget;

                if (widgetData.message === "widgetClose") {
                    // закрытие через крестик
                    setOpen(false);
                } else if (widgetData.pickupPointResult) {

                    console.log(widgetData);

                    const address = widgetData?.location?.address


                    setPointInfo({
                        pickup_point_id: widgetData?.id,
                        country: address?.country,
                        street: address?.street,
                        city: address.city,
                        zip: address.zip,
                        sellerId
                    })

                    // выбран пункт выдачи, передаём наружу
                    // onSelect(widgetData);
                    // можно закрывать после выбора
                    setIsNotChoose(false);
                    setOpen(false);
                }
            }
        }

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    return (
        <div>
            {/* <button onClick={() => setOpen(true)}>Выбрать пункт DPD</button> */}

            {open && (
                <div className="dpd-widget-modal" style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <div style={{ width: isMobile ? "95%" : "90%", height:  "90%", position: 'relative' }}>
                        {/* кнопка закрытия своя */}

                        <iframe
                            ref={iframeRef}
                            src={srcUrl}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default DpdPickupWidget;
