package com.hrservice.gateway;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
@EnableConfigurationProperties({WebProperties.class})
public class ApiGatewayApplication {

    public static void main(String[] args) {
        // 1. Nạp file .env từ thư mục hiện tại
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        // 2. Đưa các biến vào System Properties để Spring nhìn thấy
        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
        });

        // 3. Khởi chạy ứng dụng
        ConfigurableApplicationContext context = SpringApplication.run(ApiGatewayApplication.class, args);

        // 4. In ra kiểm tra để chắc chắn đã nạp từ .env thành công
        String redisPass = context.getEnvironment().getProperty("spring.data.redis.password");
        System.out.println("\n=========================================");
        System.out.println("XÁC NHẬN NẠP BIẾN .ENV THÀNH CÔNG:");
        System.out.println("Mật khẩu Redis: " + redisPass);
        System.out.println("=========================================\n");
    }
}