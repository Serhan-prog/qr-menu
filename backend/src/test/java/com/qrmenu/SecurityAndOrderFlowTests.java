package com.qrmenu;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qrmenu.entity.Category;
import com.qrmenu.entity.Product;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.entity.RestaurantTable;
import com.qrmenu.entity.User;
import com.qrmenu.entity.UserRole;
import com.qrmenu.repository.CategoryRepository;
import com.qrmenu.repository.ProductRepository;
import com.qrmenu.repository.RestaurantRepository;
import com.qrmenu.repository.RestaurantTableRepository;
import com.qrmenu.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import jakarta.servlet.http.Cookie;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAndOrderFlowTests {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private RestaurantTableRepository tableRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private RestaurantTable table;
    private Restaurant restaurant;
    private Category category;
    private Product product;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        tableRepository.deleteAll();
        userRepository.deleteAll();
        restaurantRepository.deleteAll();

        restaurant = new Restaurant();
        restaurant.setName("Semua Restorant");
        restaurant = restaurantRepository.save(restaurant);

        table = new RestaurantTable();
        table.setRestaurant(restaurant);
        table.setTableNumber(1);
        table.setTableCode("test-table-code");
        table = tableRepository.save(table);

        category = new Category();
        category.setRestaurant(restaurant);
        category.setName("Ana Yemekler");
        category = categoryRepository.save(category);

        product = new Product();
        product.setRestaurant(restaurant);
        product.setCategory(category);
        product.setName("Test Ürün");
        product.setPrice(new BigDecimal("100.00"));
        product = productRepository.save(product);

        User admin = new User();
        admin.setRestaurant(restaurant);
        admin.setEmail("admin@test.local");
        admin.setFullName("Test Admin");
        admin.setPasswordHash(passwordEncoder.encode("strong-pass"));
        admin.setRole(UserRole.ADMIN);
        userRepository.save(admin);
    }

    @Test
    void orderTrackingUsesPublicTrackingCodeInsteadOfPublicId() throws Exception {
        Cookie authCookie = loginCookie();

        mockMvc.perform(get("/api/auth/ws-ticket"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/auth/ws-ticket").cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticket").isString());

        mockMvc.perform(get("/api/restaurants/current").cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Semua Restorant"));

        String orderBody = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tableCode":"test-table-code","items":[{"productId":%d,"quantity":2}]}
                                """.formatted(product.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trackingCode", not(nullValue())))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode order = objectMapper.readTree(orderBody);
        long orderId = order.get("id").asLong();
        String trackingCode = order.get("trackingCode").asText();

        mockMvc.perform(get("/api/orders/" + orderId))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/orders/track/" + trackingCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(orderId))
                .andExpect(jsonPath("$.tableCode").value(table.getTableCode()));
    }

    @Test
    void adminMutationsRequireCsrfToken() throws Exception {
        Cookie authCookie = loginCookie();

        String productPayload = """
                {
                  "restaurantId": %d,
                  "categoryId": %d,
                  "name": "Yeni Ürün",
                  "description": "Test ürün açıklaması",
                  "price": 125.50,
                  "available": true,
                  "sortOrder": 5
                }
                """.formatted(restaurant.getId(), category.getId());

        mockMvc.perform(post("/api/products")
                        .cookie(authCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productPayload))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/products")
                        .with(csrf())
                        .cookie(authCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Yeni Ürün"));
    }

    private Cookie loginCookie() throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@test.local","password":"strong-pass"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn()
                .getResponse()
                .getCookie("qr_menu_token");
    }
}
