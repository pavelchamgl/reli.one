# v0 Product Review Reference

Это визуальный референс страницы Product Review из v0 для переноса в основной frontend проекта [Reli.one](http://Reli.one).

## Что использовать из v0

Использовать только контентную часть страницы:

- Product Gallery

- Product Info Block

- Variants / Stock Badges

- Preview Banner

- Description / Reviews Tabs

- Additional Details Accordion

- Review Actions

- общую композицию центральной области страницы

- пропорции блоков, отступы и визуальную логику контента

## Что НЕ использовать из v0

Не использовать и не переносить:

- Header из v0

- Footer из v0

- Sidebar из v0

- навигацию из v0

- Next.js app router

- архитектуру v0

- зависимости v0

- временные placeholder assets

- package.json / конфиги v0

## Важно по layout

Header, Footer и Sidebar должны быть взяты из уже существующей реализации frontend проекта [Reli.one](http://Reli.one).

Нужно сохранить идентичные:

- шапку

- боковую навигацию

- футер, если он используется в текущем layout

- общий layout страницы

- существующую дизайн-систему проекта

v0 используется только как визуальный и структурный референс для основной контентной области Product Review страницы.

## Основные точки входа reference-кода

- app/page.tsx

- components/seller/ProductReviewPage.tsx

- components/seller/ProductGallery.tsx

- components/seller/ProductInfo.tsx

- components/seller/ProductTabs.tsx

- components/seller/PreviewBanner.tsx

- components/seller/ReviewActions.tsx

## Цель для агента

Реализовать страницу Product Review в основном frontend проекте [Reli.one](http://Reli.one) на основе этого reference-кода.

При реализации:

- не копировать v0-проект как отдельное приложение

- не переносить layout из v0

- не переносить header/sidebar/footer из v0

- переиспользовать существующие компоненты проекта

- адаптировать под текущий routing frontend проекта

- адаптировать под текущие API и состояния товара

- сохранить визуальную структуру контентной части из v0