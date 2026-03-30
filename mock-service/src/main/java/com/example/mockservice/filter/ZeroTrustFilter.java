package com.example.mockservice.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(-101) // Đảm bảo chạy trước các logic bảo mật khác
public class ZeroTrustFilter extends OncePerRequestFilter {

    @Value("${app.internal-secret}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Lấy mật mã từ Header mà Gateway đã gắn vào
        String incomingSecret = request.getHeader("X-Internal-Secret");

        // 2. Kiểm tra tính hợp lệ
        if (incomingSecret == null || !incomingSecret.equals(internalSecret)) {
            // Nếu không có mật mã hoặc sai -> Chặn đứng (403 Forbidden)
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"code\": 403, \"message\": \"Quyền truy cập bị từ chối hoặc thiếu header X-Internal-Secret\"}");
            return; // Ngắt luồng tại đây
        }

        // 3. Nếu hợp lệ, cho phép request đi tiếp vào Controller
        filterChain.doFilter(request, response);
    }
}