FROM nginx:1.25.4-alpine

COPY ./devopsbyexample.conf /etc/nginx/conf.d/devopsbyexample.conf

COPY www.solopharma.shop.crt /etc/nginx/www.solopharma.shop.crt

COPY www.solopharma.shop.key /etc/nginx/www.solopharma.shop.key

CMD ["nginx", "-g", "daemon off;"]