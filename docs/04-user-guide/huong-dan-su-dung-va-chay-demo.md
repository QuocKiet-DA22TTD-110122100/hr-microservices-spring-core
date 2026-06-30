# Huong dan su dung va chay demo

## Yeu cau phan mem

- Docker Desktop hoac Docker Engine
- Docker Compose
- JDK 17
- Node.js 18+ va npm
- Git

## Clone repository

```bash
git clone https://github.com/QuocKiet-DA22TTD-110122100/tn-da22ttd-110122100-huynhquockiet-ptWebqlcvntkt-microservices.git
cd tn-da22ttd-110122100-huynhquockiet-ptWebqlcvntkt-microservices
```

## Chay bang Docker Compose

```bash
docker compose -f microservices-compose.yml up -d --build
```

## Kiem tra dich vu

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Eureka: http://localhost:8761

## Dung he thong

```bash
docker compose -f microservices-compose.yml down
```

## Ghi chu

Neu chi can chay ban toi gian de demo nhanh, co the dung:

```bash
docker compose -f compose.minimal.yml up -d --build
```
