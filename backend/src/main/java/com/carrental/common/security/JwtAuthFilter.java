package com.carrental.common.security;

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
 */
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. Lấy token từ header Authorization
            String token = extractToken(request);

            if (StringUtils.hasText(token)) {
                // 2. Check token type — chỉ chấp nhận ACCESS token
                String tokenType = jwtService.extractTokenType(token);
                if (!"ACCESS".equals(tokenType)) {
                    filterChain.doFilter(request, response);
                    return;
                }

                // 3. Check token hợp lệ + chưa hết hạn
                String phone = jwtService.extractPhone(token);
                if (jwtService.isTokenValid(token, phone)) {
                    // 4. Lấy thông tin từ token
                    Long userId = jwtService.extractUserId(token);
                    String role = jwtService.extractRole(token);

                    // 5. Set userId + role vào request attribute (để controller dùng @RequestAttribute)
                    request.setAttribute("userId", userId);
                    request.setAttribute("role", role);

                    // 6. Set authentication vào SecurityContext
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
                }
            }
        } catch (Exception ex) {
            log.error("Cannot set user authentication: {}", ex.getMessage());
        }

        // Tiếp tục filter chain
        filterChain.doFilter(request, response);
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