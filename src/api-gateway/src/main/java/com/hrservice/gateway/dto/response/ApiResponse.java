package com.hrservice.gateway.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private int status;         // HTTP Status Code
    private String message;     // Thông báo lỗi hoặc thành công
    private T data;             // Dữ liệu trả về (nếu có)
    private LocalDateTime timestamp;
}