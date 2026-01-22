export const sellerPathnames = ["/seller/login", "/seller/reset", "/seller/successfully-reset", "/seller/verify-email", "/seller/create-password", "/seller/seller-type", "/seller/create-account", "/seller/create-verify", "/seller/application-sub", "/seller/seller-info", "/seller/seller-review", "/seller/seller-company", "/seller/seller-review-company"]


export const toISODate = (dateTime) => {
  if (!dateTime) return "";

  const [date] = dateTime.split(" "); // "15.01.2026"
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
