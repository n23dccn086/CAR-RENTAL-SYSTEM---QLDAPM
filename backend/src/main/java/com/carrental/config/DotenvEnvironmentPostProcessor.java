package com.carrental.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * Spring Boot EnvironmentPostProcessor to automatically load .env files
 * into the Spring Environment before beans and configurations are processed.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "dotenvProperties";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path envPath = findEnvFile();
        if (envPath == null || !Files.exists(envPath)) {
            return;
        }

        Map<String, Object> props = loadEnvProperties(envPath);
        if (!props.isEmpty()) {
            environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, props));
            System.out.println("[DotenvEnvironmentPostProcessor] Loaded " + props.size()
                    + " properties from: " + envPath.toAbsolutePath().normalize());
        }
    }

    private Path findEnvFile() {
        // 1. Specified via system property
        String customPath = System.getProperty("dotenv.file");
        if (customPath != null && !customPath.isBlank()) {
            Path p = Paths.get(customPath);
            if (Files.exists(p)) return p;
        }

        // 2. Candidate relative paths
        Path[] candidates = new Path[]{
                Paths.get(".env"),
                Paths.get("backend", ".env"),
                Paths.get("..", ".env")
        };

        for (Path candidate : candidates) {
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private Map<String, Object> loadEnvProperties(Path path) {
        Map<String, Object> properties = new HashMap<>();
        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // Skip empty lines and comment lines
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int eqIdx = line.indexOf('=');
                if (eqIdx <= 0) {
                    continue;
                }

                String key = line.substring(0, eqIdx).trim();
                String value = line.substring(eqIdx + 1).trim();

                // Strip surrounding quotes if present ("value" or 'value')
                if ((value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2)
                        || (value.startsWith("'") && value.endsWith("'") && value.length() >= 2)) {
                    value = value.substring(1, value.length() - 1);
                }

                properties.put(key, value);
            }
        } catch (IOException e) {
            System.err.println("[DotenvEnvironmentPostProcessor] Warning: Failed to read .env file at "
                    + path + ": " + e.getMessage());
        }
        return properties;
    }

    @Override
    public int getOrder() {
        // Run very early, before standard config file processing
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
