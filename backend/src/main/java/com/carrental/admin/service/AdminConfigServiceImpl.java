package com.carrental.admin.service;

import com.carrental.admin.dto.ConfigMapper;
import com.carrental.admin.dto.ConfigResponse;
import com.carrental.admin.entity.PlatformConfig;
import com.carrental.admin.repository.PlatformConfigRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminConfigServiceImpl implements AdminConfigService {

    PlatformConfigRepository configRepository;
    ConfigMapper configMapper;
    ConfigHelper configHelper;          // ← THÊM: để clear cache sau khi update

    @Override
    public List<ConfigResponse> getAllConfigs() {
        return configMapper.toResponseList(configRepository.findAllByOrderByConfigKeyAsc());
    }

    @Override
    public ConfigResponse getConfigByKey(String key) {
        PlatformConfig c = configRepository.findByConfigKey(key)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CONFIG_NOT_FOUND));
        return configMapper.toResponse(c);
    }

    @Override
    @Transactional
    public ConfigResponse updateConfig(String key, String value, Long adminId) {
        log.info("Admin {} updating config {}", adminId, key);

        PlatformConfig c = configRepository.findByConfigKey(key)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CONFIG_NOT_FOUND));

        if (value == null || value.isBlank()) {
            throw new BadRequestException(ErrorCode.CONFIG_INVALID_VALUE);
        }

        c.setConfigValue(value);
        c.setUpdatedBy(adminId);

        PlatformConfig updated = configRepository.save(c);

        // ★ CLEAR CACHE để áp dụng NGAY (không cần chờ 60s)
        configHelper.clearCache();

        return configMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ConfigResponse createConfig(String key, String value, String type,
                                        String description, Long adminId) {
        if (configRepository.existsByConfigKey(key)) {
            throw new BadRequestException(ErrorCode.CONFIG_INVALID_VALUE, "Key đã tồn tại");
        }

        PlatformConfig c = PlatformConfig.builder()
                .configKey(key)
                .configValue(value)
                .configType(type != null ? type : "STRING")
                .description(description)
                .updatedBy(adminId)
                .build();

        PlatformConfig saved = configRepository.save(c);

        // ★ CLEAR CACHE
        configHelper.clearCache();

        return configMapper.toResponse(saved);
    }
}