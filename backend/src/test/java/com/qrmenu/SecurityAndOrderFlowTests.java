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
import com.qrmenu.repository.BillRequestRepository;
import com.qrmenu.repository.OrderRepository;
import com.qrmenu.repository.ProductRepository;
import com.qrmenu.repository.RestaurantRepository;
import com.qrmenu.repository.RestaurantTableRepository;
import com.qrmenu.repository.UserRepository;
import com.qrmenu.repository.WaiterCallRepository;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
    private OrderRepository orderRepository;

    @Autowired
    private WaiterCallRepository waiterCallRepository;

    @Autowired
    private BillRequestRepository billRequestRepository;

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
        billRequestRepository.deleteAll();
        waiterCallRepository.deleteAll();
        orderRepository.deleteAll();
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

        User staff = new User();
        staff.setRestaurant(restaurant);
        staff.setEmail("staff@test.local");
        staff.setFullName("Test Staff");
        staff.setPasswordHash(passwordEncoder.encode("staff-pass"));
        staff.setRole(UserRole.STAFF);
        userRepository.save(staff);
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

    @Test
    void cancelledOrderExposesCancellationReasonToTrackedCustomer() throws Exception {
        Cookie authCookie = loginCookie();

        String orderBody = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tableCode":"test-table-code","items":[{"productId":%d,"quantity":1}]}
                                """.formatted(product.getId())))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode order = objectMapper.readTree(orderBody);
        long orderId = order.get("id").asLong();
        String trackingCode = order.get("trackingCode").asText();

        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .with(csrf())
                        .cookie(authCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"CANCELLED"}
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .with(csrf())
                        .cookie(authCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"CANCELLED","cancellationReason":"Urun stokta kalmadi"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancellationReason").value("Urun stokta kalmadi"));

        mockMvc.perform(get("/api/orders/track/" + trackingCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cancellationReason").value("Urun stokta kalmadi"));
    }

    @Test
    void staffCanRunOperationsButCannotChangeMenuModel() throws Exception {
        Cookie staffCookie = loginCookie("staff@test.local", "staff-pass");

        mockMvc.perform(get("/api/restaurants/current").cookie(staffCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(restaurant.getId()));

        mockMvc.perform(get("/api/orders").cookie(staffCookie))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/waiter-calls").cookie(staffCookie))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/bill-requests").cookie(staffCookie))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/ws-ticket").cookie(staffCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticket").isString());

        String orderBody = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tableCode":"test-table-code","items":[{"productId":%d,"quantity":1}]}
                                """.formatted(product.getId())))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long orderId = objectMapper.readTree(orderBody).get("id").asLong();

        Cookie csrfCookie = mockMvc.perform(get("/api/csrf").cookie(staffCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn()
                .getResponse()
                .getCookie("XSRF-TOKEN");

        assertNotNull(csrfCookie);

        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .cookie(staffCookie, csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"PREPARING"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PREPARING"));

        mockMvc.perform(post("/api/products")
                        .with(csrf())
                        .cookie(staffCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "restaurantId": %d,
                                  "categoryId": %d,
                                  "name": "Personel Urunu",
                                  "price": 90.00
                                }
                                """.formatted(restaurant.getId(), category.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void bearerAuthenticatedOperationsCanUpdateOrderWaiterAndBillStatusesWithoutCsrfCookie() throws Exception {
        String staffToken = loginToken("staff@test.local", "staff-pass");

        String orderBody = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tableCode":"test-table-code","items":[{"productId":%d,"quantity":1}]}
                                """.formatted(product.getId())))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long orderId = objectMapper.readTree(orderBody).get("id").asLong();

        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"PREPARING"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PREPARING"));

        String waiterBody = mockMvc.perform(post("/api/waiter-calls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tableCode":"test-table-code","message":"Garson gerekli"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long waiterCallId = objectMapper.readTree(waiterBody).get("id").asLong();

        mockMvc.perform(patch("/api/waiter-calls/" + waiterCallId + "/status")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"COMPLETED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        String billBody = mockMvc.perform(post("/api/bill-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tableCode":"test-table-code","note":"Hesap istendi"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long billRequestId = objectMapper.readTree(billBody).get("id").asLong();

        mockMvc.perform(patch("/api/bill-requests/" + billRequestId + "/status")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"PAID"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));
    }

    private Cookie loginCookie() throws Exception {
        return loginCookie("admin@test.local", "strong-pass");
    }

    private Cookie loginCookie(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn()
                .getResponse()
                .getCookie("qr_menu_token");
    }

    private String loginToken(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }
}
