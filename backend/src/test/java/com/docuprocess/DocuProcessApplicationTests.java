package com.docuprocess;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class DocuProcessApplicationTests {

    @Test
    void contextLoads() {
        assertTrue(true, "Spring Application Context initialized cleanly.");
    }
}

