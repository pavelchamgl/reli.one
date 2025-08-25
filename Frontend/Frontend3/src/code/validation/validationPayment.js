import czZipcodes from "../../code/zipcodes/cz-zipcodes.json"
import huZipcodes from "../../code/zipcodes/hu-zipcodes.json"
import skZipcodes from "../../code/zipcodes/sk-zipcodes.json"
import roZipcodes from "../../code/zipcodes/ro-zipcodes.json"

const phoneRegexes = {
    cz: /^(?:\+420|0)\d{9}$/,
    sk: /^(?:\+421|0)\d{9}$/,
    ro: /^(?:\+40|0)\d{9,10}$/,
    hu: /^(?:\+36|06)\d{8,9}$/,
};

export function isValidPhone(phone, countryCode) {
    const cleaned = phone?.replace(/\s|-/g, ''); // удаляем пробелы и дефисы
    const regex = phoneRegexes[countryCode];


    return regex?.test(cleaned) ?? false;
}


export function isValidZipCode(country, zip) {

    
    const normalized = zip.replace(/\s/g, "");
    if (country === "cz") {
        return czZipcodes[country]?.includes(normalized) ?? false;
    }
    if (country === "hu") {
        return huZipcodes[country]?.includes(normalized) ?? false;
    }
    if (country === "sk") {
        return skZipcodes[country]?.includes(normalized) ?? false;
    }
      if(country === "ro"){
      return roZipcodes[country]?.includes(normalized) ?? false;
  }
}
