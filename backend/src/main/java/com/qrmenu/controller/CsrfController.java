package com.qrmenu.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CsrfController {
    @GetMapping("/api/csrf")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void issue(CsrfToken csrfToken) {
        csrfToken.getToken();
    }
}
