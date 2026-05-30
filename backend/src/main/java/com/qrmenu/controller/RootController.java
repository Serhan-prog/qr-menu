package com.qrmenu.controller;

import com.qrmenu.dto.ApiInfoResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {
    @GetMapping("/")
    public ApiInfoResponse index() {
        return new ApiInfoResponse(
                "QR Menu Backend API",
                "UP",
                "1.0.0",
                null
        );
    }
}
