package com.smartevent;

import com.smartevent.config.TicketmasterProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
@EnableConfigurationProperties(TicketmasterProperties.class)
public class SmartEventApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartEventApplication.class, args);
    }
}
