package com.carrental.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "BearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Car Rental System API (Maison)")
                        .description("Tài liệu đặc tả toàn bộ REST API hệ thống cho thuê xe ô tô tự lái & có tài xế (Car Rental System) theo tài liệu SRS QLDAPM.")
                        .version("1.0.0")
                        .contact(new Contact().name("Đội ngũ phát triển Car Rental").email("support@carrental.vn"))
                        .license(new License().name("Apache 2.0").url("https://springdoc.org")))
                .servers(List.of(
                        new Server().url("/api/v1").description("Local Development Server (Context Path)")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Nhập Access Token JWT (không cần gõ tiền tố Bearer)")))
                .tags(List.of(
                        new Tag().name("1. Authentication").description("Đăng ký, đăng nhập, refresh token, đổi mật khẩu, OTP"),
                        new Tag().name("2. User & Documents").description("Hồ sơ cá nhân và xác minh 5 ảnh GPLX/CCCD/Selfie"),
                        new Tag().name("3. Cars").description("Tìm kiếm, lọc danh mục xe, thông tin chi tiết và quản lý xe của chủ xe"),
                        new Tag().name("4. Bookings").description("Tạo đơn thuê xe, duyệt đơn, hủy đơn và tính phí phạt/hoàn cọc"),
                        new Tag().name("5. Payments").description("Thanh toán tiền cọc, tất toán, webhook tích hợp MoMo"),
                        new Tag().name("6. Handover").description("Biên bản giao xe (Pickup) và nhận lại xe (Return), chốt km/xăng"),
                        new Tag().name("7. Drivers").description("Quản lý tài xế, phân công chuyến đi và tài xế nhận chuyến"),
                        new Tag().name("8. Reviews").description("Đánh giá xe và đánh giá đối tác chủ xe sau chuyến đi"),
                        new Tag().name("9. Disputes").description("Khiếu nại chuyến đi, giải quyết tranh chấp bồi thường"),
                        new Tag().name("10. Withdrawals").description("Yêu cầu rút tiền từ ví chủ xe về tài khoản ngân hàng"),
                        new Tag().name("11. Admin").description("Quản trị hệ thống, phê duyệt xe, người dùng, hoàn tiền, rút tiền"),
                        new Tag().name("12. AI Chatbot").description("Trợ lý ảo AI tư vấn xe, chính sách và thống kê theo Role"),
                        new Tag().name("13. Notifications").description("Hệ thống thông báo đẩy cho khách hàng, chủ xe, admin"),
                        new Tag().name("14. Upload & Excel").description("Upload file phương tiện và import danh sách xe hàng loạt qua Excel")
                ));
    }
}
