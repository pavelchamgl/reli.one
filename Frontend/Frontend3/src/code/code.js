export const getAllLowestLevelChildren = (data) => {
    const result = [];

    const findLowestLevelChildren = (items) => {
        items.forEach(item => {
            if (item.children && item.children.length > 0) {
                // Добавляем текущий объект в результат
                result.push(item);
                // Рекурсивно обрабатываем его детей
                findLowestLevelChildren(item.children);
            } else {
                // Добавляем объект без детей
                result.push(item);
            }
        });
    };

    findLowestLevelChildren(data);
    return result;
};
