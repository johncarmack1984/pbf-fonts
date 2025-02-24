#!/bin/bash

root_key="certs/rootCA.key"
root_cert="certs/rootCert.pem"

root_exists=false

if [ -f $root_key ] && [ -f $root_cert ]; then
    root_exists=true
fi

if [ $root_exists ] && [ -z $1 ]; then echo "Skipping root certificate..."; else
    printf "Generating root certificate..."
    openssl req \
        -quiet \
        -newkey rsa:2048 \
        -keyout $root_key \
        -x509 \
        -new \
        -noenc \
        -sha256 \
        -days 730 \
        -subj "/C=US" \
        -out $root_cert 2>/dev/null
    printf "done\n"
fi

printf "Generating certificate request..."
openssl req \
    -quiet \
    -newkey rsa:2048 \
    -keyout certs/cert.key \
    -new \
    -noenc \
    -subj "/C=US" \
    -out certs/cert.csr 2>/dev/null
printf "done\n"

printf "Signing certificate...\n"
openssl x509 \
    -req \
    -in certs/cert.csr \
    -CA certs/rootCert.pem \
    -CAkey certs/rootCA.key \
    -CAcreateserial \
    -out certs/cert.crt \
    -days 730 \
    -sha256 \
    -extfile certs/openssl.cnf
printf "done\n"

printf "Verifying certificate...\n"
openssl verify \
    -CAfile certs/rootCert.pem \
    -verify_hostname local.yourhostname \
    certs/cert.crt
printf "done\n"
