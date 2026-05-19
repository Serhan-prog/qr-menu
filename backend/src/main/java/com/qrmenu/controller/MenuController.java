package com.qrmenu.controller;

import com.qrmenu.dto.MenuResponse;
import com.qrmenu.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {
    private final MenuService menuService;

    @GetMapping("/table/{tableCode}")
    public MenuResponse getMenuByTable(@PathVariable String tableCode) {
        return menuService.getMenuByTableCode(tableCode);
    }
}
