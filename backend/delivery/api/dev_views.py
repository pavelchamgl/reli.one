# delivery/api/dev_views.py
import re
from django.http import HttpResponse, JsonResponse
from django.conf import settings

from rest_framework import serializers, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from delivery.providers.mygls import builders
from delivery.providers.mygls.client import MyGlsClient
from delivery.providers.mygls.service import MyGlsService, SimpleShipment
from delivery.providers.mygls.parcelshops import get_parcelshop


# ---------- Serializers ----------

class DevMyGlsShipmentSerializer(serializers.Serializer):
    # Режим доставки
    mode = serializers.ChoiceField(choices=[("home", "home"), ("pudo", "pudo")])
    client_reference = serializers.CharField(required=False, allow_blank=True)
    content = serializers.CharField(required=False, allow_blank=True, max_length=50)

    # Получатель
    receiver_name = serializers.CharField()
    receiver_street = serializers.CharField()
    receiver_house_number = serializers.RegexField(
        r"^\d+$", help_text="Только цифры по требованию MyGLS"
    )
    receiver_city = serializers.CharField()
    receiver_zip = serializers.CharField()
    receiver_country_iso = serializers.RegexField(r"^[A-Z]{2}$")
    receiver_email = serializers.EmailField(required=False, allow_blank=True)
    receiver_phone = serializers.CharField(required=False, allow_blank=True)

    # ПВЗ (обязателен для mode=pudo)
    pickup_point_id = serializers.CharField(required=False, allow_blank=True)
    pickup_point_pclshopid = serializers.CharField(required=False, allow_blank=True)
    pickup_point_country = serializers.RegexField(r"^[A-Z]{2}$", required=False)

    # Габариты одной посылки (для DEV)
    length_cm = serializers.FloatField(min_value=1)
    width_cm = serializers.FloatField(min_value=1)
    height_cm = serializers.FloatField(min_value=1)
    weight_kg = serializers.FloatField(min_value=0.01)

    # DEV-параметры печати
    type_of_printer = serializers.ChoiceField(
        choices=[("A4_2x2", "A4_2x2"), ("A4_4x1", "A4_4x1"), ("Thermo", "Thermo"), ("ThermoZPL", "ThermoZPL")],
        required=False,
    )
    print_position = serializers.IntegerField(required=False, min_value=1, max_value=4)
    flow = serializers.ChoiceField(
        choices=[("print", "print"), ("prepare", "prepare")], required=False
    )

    def validate(self, attrs):
        if attrs["mode"] == "pudo":
            if not attrs.get("pickup_point_id") and not attrs.get("pickup_point_pclshopid"):
                raise serializers.ValidationError("Нужен pickup_point_id или pickup_point_pclshopid.")
            # определяем страну пункта: сначала то, что прислал фронт, иначе — страна получателя
            ps_country = (attrs.get("pickup_point_country") or attrs["receiver_country_iso"]).upper()

            # если pclshopid нет — попробуем найти пункт в фиде этой страны и вытянуть страну/валидность
            from delivery.providers.mygls.parcelshops import get_parcelshop
            shop = None
            if attrs.get("pickup_point_id"):
                shop = get_parcelshop(attrs["pickup_point_id"], ps_country)
            # если нашли — проверим страну
            if shop and shop.get("country") and shop["country"] != ps_country:
                raise serializers.ValidationError(f"Страна ПВЗ ({shop['country']}) не совпадает с указанной ({ps_country}).")

            # для удобства прокинем в validated_data
            attrs["_parcelshop_country"] = ps_country
            # если из фида смогли вывести цифровой хвост — сохраним (PL кейс)
            if (not attrs.get("pickup_point_pclshopid")) and shop:
                import re
                tail = re.search(r"(\d+)$", shop["id"] or "")
                if tail:
                    attrs["_parcelshop_pcl"] = tail.group(1)
        return attrs


# ---------- DEV: печать ярлыка (PrintLabels / Prepare→GetPrinted) ----------

class DevShipMyGLS(APIView):
    """
    DEV: Создаёт 1 отправление в MyGLS и печатает ярлык.
    Сохраняет файл в storage и возвращает URL, номера и метаданные.
    """

    def post(self, request):
        ser = DevMyGlsShipmentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        # Отправитель — временно из settings (позже возьмём со склада/продавца)
        sender = builders.build_address(
            name=getattr(settings, "COMPANY_NAME", "Reli Group s.r.o."),
            street=getattr(settings, "COMPANY_STREET", "Prumyslova"),
            house_number=str(getattr(settings, "COMPANY_HOUSE_NUMBER", "5619")),
            city=getattr(settings, "COMPANY_CITY", "Jihlava"),
            zip_code=getattr(settings, "COMPANY_ZIP", "58601"),
            country_iso=getattr(settings, "COMPANY_COUNTRY_ISO", "CZ"),
        )

        # Получатель
        receiver = builders.build_address(
            name=d["receiver_name"],
            street=d["receiver_street"],
            house_number=d["receiver_house_number"],  # только цифры
            city=d["receiver_city"],
            zip_code=d["receiver_zip"],
            country_iso=d["receiver_country_iso"],
            contact_name=d["receiver_name"],
            contact_phone=d.get("receiver_phone"),
            contact_email=d.get("receiver_email"),
        )

        services = []
        # FDS вместе с PSD не шлём
        if d.get("receiver_email") and d["mode"] != "pudo":
            services.append(builders.build_service("FDS", "FDSParameter", {"Value": d["receiver_email"]}))

        if d["mode"] == "pudo":
            # 1) пробуем взять цифры из pickup_point_pclshopid
            ps_pcl_raw = str(d.get("pickup_point_pclshopid") or "").strip()
            m = re.search(r"(\d+)$", ps_pcl_raw)
            if m:
                services.append(builders.build_service("PSD", "PSDParameter", {"IntegerValue": int(m.group(1))}))
            else:
                # 2) если не получилось — пытаемся по pickup_point_id (тоже может быть 'GLS_PL-...')
                ps_id_raw = str(d.get("pickup_point_id") or "").strip()
                m2 = re.search(r"(\d+)$", ps_id_raw)
                if m2:
                    services.append(builders.build_service("PSD", "PSDParameter", {"IntegerValue": int(m2.group(1))}))
                else:
                    # 3) фолбэк: строковый ID (работает не на всех стендах)
                    services.append(builders.build_service("PSD", "PSDParameter", {"Value": ps_id_raw}))

        # Свойства отправления
        properties = [
            builders.build_properties(
                length_cm=d["length_cm"],
                width_cm=d["width_cm"],
                height_cm=d["height_cm"],
                weight_kg=d["weight_kg"],
                package_type=2,  # Parcel
                content=d.get("content") or "Merchandise",
            )
        ]

        shipment = SimpleShipment(
            client_reference=(d.get("client_reference") or None),
            sender=sender,
            receiver=receiver,
            services=services,
            properties=properties,
        )

        svc = MyGlsService()
        printer = d.get("type_of_printer") or None  # если None — возьмётся из settings
        print_position = d.get("print_position") or 1
        flow = d.get("flow") or "print"

        if flow == "prepare":
            # Двухшаговый поток: Prepare → GetPrinted
            file_bytes, info, ids, numbers, errors = svc.prepare_then_print(
                [shipment], type_of_printer=printer, print_position=print_position
            )
            storage_path, url = svc.save_label_file(
                file_bytes, "dev/mygls_labels", printer=(printer or svc.type_of_printer)
            )
            payload = {
                "ok": True,
                "flow": "prepare",
                "parcel_ids": ids,
                "parcel_numbers": numbers,
                "label_url": url,
                "print_info": info,
                "errors": errors,
                "printer": (printer or svc.type_of_printer),
            }
        else:
            # Одношаговый поток: PrintLabels
            result = svc.create_print_and_store(
                [shipment],
                store_dir="dev/mygls_labels",
                type_of_printer=printer,
                print_position=print_position,
            )
            payload = {
                "ok": True,
                "flow": "print",
                "parcel_numbers": result["parcel_numbers"],
                "label_url": result["url"],
                "print_info": result["print_info"],
                "errors": result["errors"],
                "printer": result["printer"],
            }

        return Response(payload, status=status.HTTP_201_CREATED)


# ---------- DEV: быстрая проверка авторизации ----------

class DevMyGLSAuthCheck(APIView):
    """
    Пингуем PrintLabels с пустым ParcelList.
    Если авторизация ОК → вернётся 200/400 с JSON из MyGLS.
    Если НЕ ОК → поднимется исключение в клиенте или статус 401 от сервера.
    """

    def get(self, request):
        client = MyGlsClient.from_settings()
        url = f"{client.base_url}/PrintLabels"
        # Минимальный «валидный» запрос без посылок
        body = {
            **client._auth_payload(),
            "ParcelList": [],
            "TypeOfPrinter": "A4_2x2",
            "PrintPosition": 1,
        }
        r = client.session.post(url, json=body, timeout=client.timeout)
        try:
            payload = r.json()
        except Exception:
            payload = r.text[:800]

        debug = {
            "username": client.username,
            "webshop_engine": client.webshop_engine,
            "password_mode": getattr(client, "password_format", "bytes"),
            "password_len": len(getattr(client, "_password_bytes_array", [])),
            "password_preview": list(getattr(client, "_password_bytes_array", [])[:6]),
            "include_client_number_list": getattr(client, "include_client_number_list", False),
            "url": url,
        }
        return Response({"status": r.status_code, "payload": payload, "debug": debug})


class GlsPudoCallback(APIView):

    def get(self, request):
        q = request.GET.dict()
        # Попробуем вытащить pclshopid из хвоста ID (работает для PL вида 'GLS_PL-6160116971')
        pcl = None
        if "id" in q:
            m = re.search(r"(\d+)$", q["id"])
            if m:
                pcl = m.group(1)
        data = {
            "query": q,
            "pclshopid_guess": pcl,                            # для PL это настоящий pclshopid
            "country_guess": (q.get("ctrcode") or "").upper() or None,
        }
        return JsonResponse(data, json_dumps_params={"indent": 2})


# --- DEV: страница с iFrame, которая выводит сырое postMessage с pclshopid ---
class GlsPudoEchoPage(APIView):

    def get(self, request):
        country = (request.GET.get("ctrcode") or "PL").upper()
        html = f"""<!doctype html><meta charset="utf-8">
<h3>GLS PUDO test ({country})</h3>
<pre id="out" style="white-space:pre-wrap;background:#111;color:#0f0;padding:12px"></pre>
<iframe src="https://ps-maps.gls-czech.com?find=1&ctrcode={country}&lng=en"
        style="width:100%;height:700px;border:0"></iframe>
<script>
  const out = document.getElementById('out');
  window.addEventListener('message', (e) => {{
    if (!String(e.origin).includes('ps-maps.gls-czech.com')) return;
    out.textContent = JSON.stringify(e.data, null, 2);
    console.log('GLS message:', e.data);
  }});
</script>"""
        return HttpResponse(html)
