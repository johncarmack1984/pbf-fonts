FROM ghcr.io/maplibre/martin:latest

ENV RUST_LOG="actix_web=info,martin=info"

COPY . .

CMD ["--config", "config.yaml", "--listen-addresses", "[::]:3000"]
