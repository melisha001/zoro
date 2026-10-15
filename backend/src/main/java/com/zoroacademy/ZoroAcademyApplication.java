package com.zoroacademy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ZoroAcademyApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZoroAcademyApplication.class, args);
    }
}
