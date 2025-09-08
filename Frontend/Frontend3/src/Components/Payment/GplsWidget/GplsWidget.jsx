import { useEffect } from "react";

const GlsWidget = ({ open, setOpen, onSelect }) => {
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

        // Ждём когда GLS вставит ID в hidden input
        const handleInterval = setInterval(() => {
            const id = document.getElementById("psGlsId")?.value;
            if (id) {
                clearInterval(handleInterval);
                onSelect({
                    id,
                    name: document.getElementById("psGlsName")?.value,
                    address: document.getElementById("psGlsStreet")?.value,
                    cityZip: document.getElementById("psGlsZipAndCity")?.value,
                    country: document.getElementById("psGlsCountry")?.value,
                });
                setOpen(false);
            }
        }, 500);

        return () => clearInterval(handleInterval);
    }, [open]);

    if (!open) return null;

    return (
        <div>
            <button onClick={() => window.findGlsPs()}>
                Vybrat GLS ParcelShop
            </button>

            <input type="hidden" id="psGlsId" />
            <input type="hidden" id="psGlsName" />
            <input type="hidden" id="psGlsStreet" />
            <input type="hidden" id="psGlsZipAndCity" />
            <input type="hidden" id="psGlsCountry" />
        </div>
    );
};

export default GlsWidget;
