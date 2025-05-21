import { useEffect, useRef, useState } from "react";

const PacketaWidget = ({open, setOpen}) => {
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    // Загружаем скрипт виджета один раз при монтировании
    const script = document.createElement("script");
    script.src = "https://widget.packeta.com/www/js/library.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleOpenWidget = () => {
    if (!window?.Packeta?.Widget) {
      console.warn("Виджет ещё не загружен");
      return;
    }

    const packetaApiKey = "197fd6840f332ccf"; // Твой API-ключ (для теста)
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
    };

    const showSelectedPickupPoint = (point) => {
      if (point) {
        console.log("Выбранный пункт:", point);
        setSelectedPoint(point);
        if (resultRef.current) {
          resultRef.current.innerText = `Address: ${point.formatedValue}`;
        }
      }
    };

    window.Packeta.Widget.pick(packetaApiKey, showSelectedPickupPoint, packetaOptions);
  };



  return (
    <div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleOpenWidget}
      >
        Выбрать пункт выдачи
      </button>

      {selectedPoint && (
        <div className="mt-2 p-4 border rounded">
          <p><strong>{selectedPoint.name}</strong></p>
          <p>{selectedPoint.street}, {selectedPoint.city}</p>
          <p>Код пункта: <strong>{selectedPoint.id}</strong></p>
        </div>
      )}
    </div>
  );
};

export default PacketaWidget;