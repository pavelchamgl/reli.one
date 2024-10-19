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

