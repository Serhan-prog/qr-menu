package com.qrmenu.controller;

import com.qrmenu.dto.TableRequest;
import com.qrmenu.dto.TableResponse;
import com.qrmenu.service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {
    private final TableService tableService;

    @GetMapping
    public List<TableResponse> findAll(@RequestParam(required = false) Long restaurantId) {
        return tableService.findAll(restaurantId);
    }

    @GetMapping("/{id}")
    public TableResponse findById(@PathVariable Long id) {
        return tableService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TableResponse create(@Valid @RequestBody TableRequest request) {
        return tableService.create(request);
    }

    @PutMapping("/{id}")
    public TableResponse update(@PathVariable Long id, @Valid @RequestBody TableRequest request) {
        return tableService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        tableService.delete(id);
    }
}
