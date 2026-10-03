package com.carrental.admin.service;

import com.carrental.admin.dto.ConfigResponse;

import java.util.List;

public interface AdminConfigService {

    List<ConfigResponse> getAllConfigs();

    ConfigResponse getConfigByKey(String key);

    ConfigResponse updateConfig(String key, String value, Long adminId);

    ConfigResponse createConfig(String key, String value, String type,
                                 String description, Long adminId);
}