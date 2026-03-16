# Bugfix Requirements Document

## Introduction

Lỗi 404 NOT_FOUND xảy ra khi test endpoint `/api/v1/auth/register` qua API Gateway. Hệ thống trả về thông báo "No static resource api/v1/auth/register" thay vì route request đến User Service để xử lý user registration. Điều này ngăn cản việc đăng ký người dùng mới thông qua API Gateway.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN gửi POST request đến `/api/v1/auth/register` qua API Gateway (port 8080) THEN hệ thống trả về 404 NOT_FOUND với message "No static resource api/v1/auth/register"

1.2 WHEN API Gateway nhận request với path `/api/v1/auth/register` THEN hệ thống không tìm thấy route phù hợp và xử lý như static resource

1.3 WHEN mock-service (chứa authentication endpoints) không được include trong docker-compose THEN service không khả dụng để xử lý authentication requests

### Expected Behavior (Correct)

2.1 WHEN gửi POST request đến `/api/v1/auth/register` qua API Gateway THEN hệ thống SHALL route request đến authentication service và trả về response thành công

2.2 WHEN API Gateway nhận request với path `/api/v1/auth/register` THEN hệ thống SHALL tìm thấy route configuration phù hợp và forward request đến backend service

2.3 WHEN mock-service được deploy và khả dụng THEN hệ thống SHALL có thể xử lý authentication requests thông qua service này

### Unchanged Behavior (Regression Prevention)

3.1 WHEN gửi request đến các existing routes như `/iam/user/login`, `/iam/user/register` THEN hệ thống SHALL CONTINUE TO route correctly đến authentication service

3.2 WHEN gửi request đến các routes khác như `/demo/**`, `/kms/**` THEN hệ thống SHALL CONTINUE TO hoạt động bình thường

3.3 WHEN authentication service xử lý requests với valid data THEN hệ thống SHALL CONTINUE TO trả về JWT tokens và user information như hiện tại