FROM node:18.16-alpine as builder

WORKDIR /frontend/

COPY ./Frontend3/ .

RUN export NODE_OPTIONS=--max-old-space-size=9000

RUN npm install

RUN npm run build


FROM node:18 as build

WORKDIR /app

COPY ./Frontend2 .

RUN npm install

RUN npm run build


FROM nginx:latest as production

COPY --from=builder /frontend/dist /data/www/onlineshop/

COPY --from=build /app/dist /data/www/landing/

COPY /nginx/default.conf /etc/nginx/conf.d/default.conf

COPY /nginx/fullchain.pem /etc/nginx/fullchain.pem

COPY /nginx/privkey.pem /etc/nginx/privkey.pem

CMD ["nginx", "-g", "daemon off;"]