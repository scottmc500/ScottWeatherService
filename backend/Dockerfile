# ============================================
# Stage 1: Builder - Setup dependencies
# ============================================
FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

# Cache dependencies layer
COPY go.mod go.sum* ./
RUN go mod download

COPY . .

# ============================================
# Stage 2: Tester - Run tests (not in production)
# ============================================
FROM builder AS tester

RUN go test -v ./...

# ============================================
# Stage 3: Compiler - Build static binary
# ============================================
FROM builder AS compiler

RUN CGO_ENABLED=0 GOOS=linux go build -a -ldflags="-s -w" -o main ./cmd/api

# ============================================
# Stage 4: Final - Minimal runtime image
# ============================================
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata wget

WORKDIR /root/

COPY --from=compiler /app/main .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://localhost:8080/health || exit 1

CMD ["./main"]
