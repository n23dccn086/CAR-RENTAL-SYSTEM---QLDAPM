package com.carrental.common.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Filter đọc JWT từ header Authorization, xác thực và set user vào SecurityContext.
 * Chạy 1 lần cho mỗi request (OncePerRequestFilter).
 *
 * ★ FIX: Phân biệt rõ các loại lỗi JWT:
 *   - Token hết hạn → trả 401 kèm code 3004
 *   - Token invalid → trả 401 kèm code 3003
 *   - Không có token → đi tiếp (public endpoint xử lý)
 */
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    JwtService jwtService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        if (!StringUtils.hasText(path)) {
            path = request.getRequestURI();
        }
        return path.contains("/auth/login")
                || path.contains("/auth/register")
                || path.contains("/auth/refresh")
                || path.contains("/auth/forgot-password")
                || path.contains("/auth/reset-password")
                || path.contains("/v3/api-docs")
                || path.contains("/swagger-ui");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        // Không có token → đi tiếp (endpoint public sẽ cho qua, endpoint cần auth sẽ 403/401)
        if (!StringUtils.hasText(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 1. Check token type — chỉ chấp nhận ACCESS token
            String tokenType = jwtService.extractTokenType(token);
            if (!"ACCESS".equals(tokenType)) {
                // Token không phải ACCESS (ví dụ REFRESH) → coi như không có token
                filterChain.doFilter(request, response);
                return;
            }

            // 2. Check token hợp lệ + chưa hết hạn
            String phone = jwtService.extractPhone(token);
            if (jwtService.isTokenValid(token, phone)) {
                // 3. Lấy thông tin từ token
                Long userId = jwtService.extractUserId(token);
                String role = jwtService.extractRole(token);

                // 4. Set userId + role vào request attribute (để controller dùng @RequestAttribute)
                request.setAttribute("userId", userId);
                request.setAttribute("role", role);

                // 5. Set authentication vào SecurityContext
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                Collections.singletonList(
                                        new SimpleGrantedAuthority("ROLE_" + role))
                        );
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Authenticated user: {} with role: {}", userId, role);
            } else {
                // Token không hợp lệ (isTokenValid = false, không throw)
                log.debug("Token invalid (isTokenValid=false)");
                writeUnauthorized(response, 3003, "Token không hợp lệ");
                return;
            }

        } catch (ExpiredJwtException ex) {
            // ★ Token hết hạn → 401
            log.debug("JWT token expired: {}", ex.getMessage());
            writeUnauthorized(response, 3004, "Token đã hết hạn. Vui lòng đăng nhập lại.");
            return;

        } catch (JwtException ex) {
            // ★ Token invalid (chữ ký sai, format sai, ...) → 401
            log.warn("JWT token invalid: {}", ex.getMessage());
            writeUnauthorized(response, 3003, "Token không hợp lệ");
            return;

        } catch (Exception ex) {
            // ★ Lỗi không xác định → 401
            log.warn("Cannot set user authentication: {}", ex.getMessage());
            writeUnauthorized(response, 3003, "Xác thực thất bại");
            return;
        }

        // Tiếp tục filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Ghi response 401 Unauthorized với JSON body theo format ApiResponse
     */
    private void writeUnauthorized(HttpServletResponse response, int code, String message)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
        response.setContentType("application/json;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");

        String json = String.format(
                "{\"success\":false,\"code\":%d,\"message\":\"%s\"}",
                code, escapeJson(message)
        );

        response.getWriter().write(json);
        response.getWriter().flush();
    }

    /**
     * Escape JSON string đơn giản để tránh lỗi format
     */
    private String escapeJson(String input) {
        if (input == null) return "";
        return input
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * Lấy token từ header "Authorization: Bearer xxx"
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}