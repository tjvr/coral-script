FROM golang as compiler
RUN go get -tags netgo -installsuffix netgo "github.com/tjvr/go-monzo" "github.com/monzo/typhon" #1
WORKDIR /work
COPY . /work
RUN go build -tags netgo -installsuffix netgo -o program

FROM alpine as certs
RUN apk add --no-cache ca-certificates

FROM scratch
COPY public /public
COPY --from=compiler /work/program /
COPY --from=certs /etc/ssl /etc/ssl
ENTRYPOINT ["/program"]
EXPOSE 8080

