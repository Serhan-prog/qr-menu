package com.qrmenu.dto;

import java.util.List;

public record ApiInfoResponse(
        String name,
        String status,
        String version,
        List<String> endpoints
) {
}
