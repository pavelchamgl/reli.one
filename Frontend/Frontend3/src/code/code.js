export const getAllLowestLevelChildren = (data) => {
    const result = [];

    const findLowestLevelChildren = (items) => {
        items.forEach(item => {
            if (item.children && item.children.length > 0) {
                // Рекурсивно обрабатываем детей
                findLowestLevelChildren(item.children);
            } else {
                // Добавляем объект без детей
                result.push(item);
            }
        });
    };

    // Начинаем с детей верхнего уровня
    data.forEach(item => {
        if (item.children && item.children.length > 0) {
            findLowestLevelChildren(item.children);
        }
    });

    return result;
};



export const groupBySeller = (items) => {
    const map = new Map();

    for (const item of items) {
        if (!map.has(item.seller_id)) {
            map.set(item.seller_id, []);
        }
        map.get(item.seller_id).push(item);
    }

    return Array.from(map, ([seller_id, items]) => ({ seller_id, items }));
};