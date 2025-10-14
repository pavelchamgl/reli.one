import czZipcodes from "../../code/zipcodes/cz-zipcodes.json"
import huZipcodes from "../../code/zipcodes/hu-zipcodes.json"
import skZipcodes from "../../code/zipcodes/sk-zipcodes.json"
import roZipcodes from "../../code/zipcodes/ro-zipcodes.json"

import plZipcodes from "../../code/zipcodes/pl_zipcodes.json"
import atZipcodes from "../../code/zipcodes/at_zipcodes.json"
import deZipcodes from "../../code/zipcodes/de_zipcodes.json"
import siZipcodes from "../../code/zipcodes/si_zipcodes.json"
import hrZipcodes from "../../code/zipcodes/hr_zipcodes.json"
import beZipcodes from "../../code/zipcodes/be_zipcodes.json"
import dkZipcodes from "../../code/zipcodes/dk_zipcodes.json"
import nlZipcodes from "../../code/zipcodes/nl_zipcodes.json"
import luZipcodes from "../../code/zipcodes/lu_zipcodes.json"
import eeZipcodes from "../../code/zipcodes/ee_zipcodes.json"
import ltZipcodes from "../../code/zipcodes/lt_zipcodes.json"
import lvZipcodes from "../../code/zipcodes/lv_zipcodes.json"
import bgZipcodes from "../../code/zipcodes/bg_zipcodes.json"
import frZipcodes from "../../code/zipcodes/fr_zipcodes.json"
import itZipcodes from "../../code/zipcodes/it_zipcodes.json"
import esZipcodes from "../../code/zipcodes/es_zipcodes.json"
import fiZipcodes from "../../code/zipcodes/fi_zipcodes.json"
import seZipcodes from "../../code/zipcodes/se_zipcodes.json"
import ptZipcodes from "../../code/zipcodes/pt_zipcodes.json"
import ieZipcodes from "../../code/zipcodes/ie_zipcodes.json"


const phoneRegexes = {
    cz: /^(?:\+420|0)\d{9}$/,                // Czech Republic
    sk: /^(?:\+421|0)\d{9}$/,                // Slovakia
    ro: /^(?:\+40|0)\d{9,10}$/,              // Romania
    hu: /^(?:\+36|06)\d{8,9}$/,              // Hungary

    // ↓ добавленные страны ↓
    pl: /^(?:\+48|0)?\d{9}$/,                // Poland
    at: /^(?:\+43|0)\d{10}$/,                // Austria
    de: /^(?:\+49|0)\d{10,11}$/,             // Germany
    si: /^(?:\+386|0)\d{7,8}$/,              // Slovenia
    hr: /^(?:\+385|0)\d{8,9}$/,              // Croatia
    be: /^(?:\+32|0)\d{8,9}$/,               // Belgium
    dk: /^(?:\+45)?\d{8}$/,                  // Denmark
    nl: /^(?:\+31|0)\d{9}$/,                 // Netherlands
    lu: /^(?:\+352)?\d{8,9}$/,               // Luxembourg
    ee: /^(?:\+372|0)?\d{7,8}$/,             // Estonia
    lt: /^(?:\+370|8)\d{8}$/,                // Lithuania
    lv: /^(?:\+371|0)?\d{8}$/,               // Latvia
    bg: /^(?:\+359|0)\d{8,9}$/,              // Bulgaria
    fr: /^(?:\+33|0)\d{9}$/,                 // France
    it: /^(?:\+39|0)?\d{9,10}$/,             // Italy
    es: /^(?:\+34|0)?\d{9}$/,                // Spain
    fi: /^(?:\+358|0)?\d{9,10}$/,            // Finland
    se: /^(?:\+46|0)\d{7,10}$/,              // Sweden
    gr: /^(?:\+30|0)?\d{10}$/,               // Greece
    pt: /^(?:\+351|0)?\d{9}$/,               // Portugal
    ie: /^(?:\+353|0)\d{7,9}$/               // Ireland
};

export function isValidPhone(phone, countryCode) {
    const cleaned = phone?.replace(/\s|-/g, ''); // удаляем пробелы и дефисы
    const regex = phoneRegexes[countryCode];


    return regex?.test(cleaned) ?? false;
}


export function isValidZipCode(country, zip) {
    if (!country || !zip) return false;

    const normalized = zip.replace(/\s/g, ""); // убираем пробелы

    switch (country) {
        case "cz":
            return czZipcodes[country]?.includes(normalized) ?? false;
        case "hu":
            return huZipcodes[country]?.includes(normalized) ?? false;
        case "sk":
            return skZipcodes[country]?.includes(normalized) ?? false;
        case "ro":
            return roZipcodes[country]?.includes(normalized) ?? false;
        case "pl":
            return plZipcodes[country]?.includes(normalized) ?? false;
        case "at":
            return atZipcodes[country]?.includes(normalized) ?? false;
        case "de":
            return deZipcodes[country]?.includes(normalized) ?? false;
        case "si":
            return siZipcodes[country]?.includes(normalized) ?? false;
        case "hr":
            return hrZipcodes[country]?.includes(normalized) ?? false;
        case "be":
            return beZipcodes[country]?.includes(normalized) ?? false;
        case "dk":
            return dkZipcodes[country]?.includes(normalized) ?? false;
        case "nl":
            return nlZipcodes[country]?.includes(normalized) ?? false;
        case "lu":
            return luZipcodes[country]?.includes(normalized) ?? false;
        case "ee":
            return eeZipcodes[country]?.includes(normalized) ?? false;
        case "lt":
            return ltZipcodes[country]?.includes(normalized) ?? false;
        case "lv":
            return lvZipcodes[country]?.includes(normalized) ?? false;
        case "bg":
            return bgZipcodes[country]?.includes(normalized) ?? false;
        case "fr":
            return frZipcodes[country]?.includes(normalized) ?? false;
        case "it":
            return itZipcodes[country]?.includes(normalized) ?? false;
        case "es":
            return esZipcodes[country]?.includes(normalized) ?? false;
        case "fi":
            return fiZipcodes[country]?.includes(normalized) ?? false;
        case "se":
            return seZipcodes[country]?.includes(normalized) ?? false;
        case "pt":
            return ptZipcodes[country]?.includes(normalized) ?? false;
        case "ie":
            return ieZipcodes[country]?.includes(normalized) ?? false;

        // ✅ Греция — нет файла с индексами, используем regex
        case "gr":
            return /^[1-9]\d{4}$/.test(normalized);

        default:
            return false;
    }
}

