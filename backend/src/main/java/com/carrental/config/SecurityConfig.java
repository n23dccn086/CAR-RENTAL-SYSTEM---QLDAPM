package com.carrental.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Các endpoint PUBLIC — không cần đăng nhập
    private static final String[] PUBLIC_ENDPOINTS = {
            "/health",
            "/api/v1/health",
            "/api/v1/auth/**",           // Register, login, refresh token
            "/api/v1/cars/**",           // Xem danh sách xe (public)
            "/api/v1/reviews/**"         // Xem đánh giá (public)
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Tắt CSRF (vì dùng JWT, không dùng session)
                .csrf(csrf -> csrf.disable())

                // Không dùng session (stateless - JWT)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Cấu hình quyền truy cập endpoint
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()   // Public endpoints
                        .anyRequest().authenticated()                     // Còn lại phải đăng nhập
                )

                // Tắt form login mặc định (không dùng trang login của Spring)
                .formLogin(form -> form.disable())

                // Tắt HTTP Basic auth
                .httpBasic(basic -> basic.disable());

        return http.build();
    }
}