export const sellerPathnames = ["/seller/login", "/seller/reset", "/seller/successfully-reset", "/seller/verify-email", "/seller/create-password", "/seller/seller-type", "/seller/create-account", "/seller/create-verify", "/seller/application-sub", "/seller/seller-info", "/seller/seller-review", "/seller/seller-company", "/seller/seller-review-company"]


export const toISODate = (dateTime) => {
  if (!dateTime) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(dateTime)) {
    return dateTime.slice(0, 10); // на случай datetime
  }

  const [date] = dateTime.split(" "); // "15.01.2026"
  console.log(date);

  const [day, month, year] = date.split(".");

  return `${year}-${month}-${day}`;
};


export const downloadBlob = (blob, fileName = "file.zip") => {
  // Создаем временный URL из blob
  const url = URL.createObjectURL(blob);

  // Создаем ссылку и симулируем клик
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  // Убираем ссылку из DOM и освобождаем память
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


export const countriesArr = [
  { text: "Czech Republic", value: "cz", key: "countries.cz" },
  { text: "Slovakia", value: "sk", key: "countries.sk" },
  { text: "Romania", value: "ro", key: "countries.ro" },
  { text: "Hungary", value: "hu", key: "countries.hu" },
  { text: "Poland", value: "pl", key: "countries.pl" },
  { text: "Austria", value: "at", key: "countries.at" },
  { text: "Germany", value: "de", key: "countries.de" },
  { text: "Slovenia", value: "si", key: "countries.si" },
  { text: "Croatia", value: "hr", key: "countries.hr" },
  { text: "Belgium", value: "be", key: "countries.be" },
  { text: "Denmark", value: "dk", key: "countries.dk" },
  { text: "Netherlands", value: "nl", key: "countries.nl" },
  { text: "Luxembourg", value: "lu", key: "countries.lu" },
  { text: "Estonia", value: "ee", key: "countries.ee" },
  { text: "Lithuania", value: "lt", key: "countries.lt" },
  { text: "Latvia", value: "lv", key: "countries.lv" },
  { text: "Bulgaria", value: "bg", key: "countries.bg" },
  { text: "France", value: "fr", key: "countries.fr" },
  { text: "Italy", value: "it", key: "countries.it" },
  { text: "Spain", value: "es", key: "countries.es" },
  { text: "Finland", value: "fi", key: "countries.fi" },
  { text: "Sweden", value: "se", key: "countries.se" },
  { text: "Greece", value: "gr", key: "countries.gr" },
  { text: "Portugal", value: "pt", key: "countries.pt" },
  { text: "Ireland", value: "ie", key: "countries.ie" }
]