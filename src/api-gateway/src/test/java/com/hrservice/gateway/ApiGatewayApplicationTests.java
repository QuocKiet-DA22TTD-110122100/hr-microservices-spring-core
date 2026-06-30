package com.hrservice.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class ApiGatewayApplicationTests {

    @MockitoBean
    private ReactiveJwtDecoder jwtDecoder;

    @Test
    void contextLoads() {
    }

}
