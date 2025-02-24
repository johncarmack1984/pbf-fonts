FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf || true

COPY nginx.conf /etc/nginx
COPY ./certs /etc/ssl/certs
COPY ./cache /var/cache/nginx
