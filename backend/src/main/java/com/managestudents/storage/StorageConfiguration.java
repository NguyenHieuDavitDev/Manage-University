package com.managestudents.storage;

import com.managestudents.security.JwtProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({StorageProperties.class, JwtProperties.class})
public class StorageConfiguration {
}
