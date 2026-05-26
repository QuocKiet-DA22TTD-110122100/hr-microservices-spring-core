# Deployment Checklist

Checklist ngắn để dùng khi deploy hệ thống này theo thứ tự an toàn và ít lỗi nhất.

## Trước khi chạy

- Đã tạo network `microservices-network`.
- Đã có đủ biến môi trường cho Redis, Eureka, MySQL, Postgres, JWT và `INTERNAL_SECRET`.
- Đã chắc chắn request public chỉ đi qua `api-gateway`.
- Đã chắc chắn endpoint nội bộ không bị expose ra ngoài.

## Thứ tự chạy

1. Chạy `compose.infra.yml`.
2. Chờ `redis` và `eureka-server` healthy.
3. Chạy `compose.iam.yml`.
4. Chờ `kms-service` healthy, rồi kiểm tra `auth-service` lên sau.
5. Chạy `compose.hr.yml`.
6. Chạy `compose.edge.yml` cuối cùng.

## Sau khi chạy

- `GET /actuator/health` của từng service phải trả OK.
- `api-gateway` phải route đúng `/api/iam/*`.
- `auth-service` phải verify token bằng JWKS cache.
- `hr-service` chỉ nhận sync nội bộ với `X-Internal-Secret`.
- `frontend` chỉ gọi API qua `/api`.

## Phân quyền nhanh

- `api-gateway`: xác thực, rate limit, chặn header giả mạo, route.
- `auth-service`: đăng ký, đăng nhập, đổi mật khẩu, verify/revoke token.
- `kms-service`: khóa ký và JWKS public.
- `hr-service`: nhân sự và sync nội bộ.
- `redis`: cache, blacklist token, throttle.

## Lỗi hay gặp

- Mở `auth-service` trước `kms-service`.
- Mở `frontend` khi `api-gateway` chưa healthy.
- Gọi sync HR bằng endpoint public.
- Thiếu `REDIS_PASSWORD` hoặc `INTERNAL_SECRET`.
- Không chờ `start_period` đủ lâu cho service khởi động chậm.