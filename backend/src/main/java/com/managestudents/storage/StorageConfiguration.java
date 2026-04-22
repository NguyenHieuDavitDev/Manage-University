package com.managestudents.storage;

import com.managestudents.security.JwtProperties;
import com.managestudents.chat.GeminiProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({StorageProperties.class, JwtProperties.class, GeminiProperties.class})
public class StorageConfiguration {
}
