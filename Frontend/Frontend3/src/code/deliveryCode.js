export function ppl(volume = 'm', weight = 15, isHand = true, region = 'cz') {
    // Проверка на null, undefined и 0
    weight = (weight == null || weight === 0) ? 15 : weight;
    console.log(weight);

    if (weight > 31.5) {
        return 'PPL не доставляет посылки больше 31.5кг';
    }

    let price = 0;
    let days = 0;

    if (region === 'cz') {
        days = 1;
        if (isHand) {
            if (volume === 's') {
                price = 106;
            } else if (volume === 'm') {
                price = 108;
            } else if (volume === 'l') {
                price = 139;
            }
        } else {
            if (volume === 's') {
                price = 76;
            } else if (volume === 'm') {
                price = 78;
            } else if (volume === 'l') {
                price = 119;
            }
        }
    }

    return { price, days };
}


export function geis(weight = 75) {
    // Проверка на null, undefined и 0
    weight = (weight == null || weight === 0) ? 75 : weight;
    console.log(weight);

    let price = 0;
    const days = 1;

    if (weight <= 50) {
        price = 700;
    } else if (weight <= 75) {
        price = 850;
    } else if (weight <= 100) {
        price = 1050;
    } else if (weight <= 150) {
        price = 1500;
    } else {
        return "Не доставляет посылки больше 150кг";
    }

    return price;
}

const dpdPrice = [
    171, 177.17241379, 183.34482759, 189.51724138, 195.68965517,
    201.86206897, 208.03448276, 214.20689655, 220.37931034, 226.55172414,
    232.72413793, 238.89655172, 245.06896552, 251.24137931, 257.4137931,
    263.5862069, 269.75862069, 275.93103448, 282.10344828, 288.27586207,
    294.44827586, 300.62068966, 306.79310345, 312.96551724, 319.13793103,
    325.31034483, 331.48275862, 337.65517241, 343.82758621, 350
];

export const dpd = (weight = 15) => {
    // Проверка на null, undefined и 0
    weight = (weight == null || weight === 0) ? 15 : weight;

    const roundedWeight = Math.round(weight);

    if (roundedWeight > 30) {
        return "DPD не доставляет посылки больше 30кг";
    }

    if (dpdPrice[roundedWeight - 1]) {
        let shortPrice = dpdPrice[roundedWeight - 1].toFixed(2);
        return Number(shortPrice);
    } else {
        return "DPD не доставляет посылки больше 30кг";
    }
}

export const calculateBoxSize = (height = 30, width = 30, length = 30) => {
    // Проверка на null, undefined и 0
    height = (height == null || height === 0) ? 30 : height;
    width = (width == null || width === 0) ? 30 : width;
    length = (length == null || length === 0) ? 30 : length;

    const sizes = {
        S: { height: 30, width: 30, length: 30 },
        M: { height: 40, width: 60, length: 30 },
        L: { height: 50, width: 100, length: 50 }
    };

    if (height <= sizes.S.height && width <= sizes.S.width && length <= sizes.S.length) {
        return 's';
    } else if (height <= sizes.M.height && width <= sizes.M.width && length <= sizes.M.length) {
        return 'm';
    } else if (height <= sizes.L.height && width <= sizes.L.width && length <= sizes.L.length) {
        return 'l';
    } else {
        return 'Коробка превышает максимальные размеры L';
    }
}
