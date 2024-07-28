FROM node:18.16-alpine as builder-frontend3

WORKDIR /Frontend3

COPY ./Frontend3/ .

RUN export NODE_OPTIONS=--max-old-space-size=9000

RUN npm install

RUN npm run build


FROM node:18 as builder-frontend2

WORKDIR /Frontend2

COPY ./Frontend2/ .

RUN npm install

RUN npm run build


FROM nginx:latest as production

# Копируем сборку Frontend3
COPY --from=builder-frontend3 /Frontend3/dist /data/www/onlineshop/

# Копируем конфигурацию nginx и сертификаты
COPY /nginx/default.conf /etc/nginx/conf.d/default.conf
COPY /nginx/reli.crt /etc/nginx/reli.crt
COPY /nginx/reli.key /etc/nginx/reli.key

CMD ["nginx", "-g", "daemon off;"]
