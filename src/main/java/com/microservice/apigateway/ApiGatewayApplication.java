package com.microservice.apigateway;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

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
        SpringApplication.run(ApiGatewayApplication.class, args);
        System.out.println("\n=========================================");
        System.out.println(".ENV loaded. Application started successfully.");
        System.out.println("=========================================\n");
    }
}