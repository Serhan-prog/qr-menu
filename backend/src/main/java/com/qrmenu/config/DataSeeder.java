package com.qrmenu.config;

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
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.HexFormat;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {
    private final RestaurantRepository restaurantRepository;
    private final RestaurantTableRepository tableRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public void run(String... args) {
        if (restaurantRepository.count() > 0) {
            normalizeDemoTurkishData();
            return;
        }

        Restaurant restaurant = new Restaurant();
        restaurant.setName("Semua Restorant");
        restaurant.setAddress("İstanbul");
        restaurant.setPhone("05313632014");
        restaurant = restaurantRepository.save(restaurant);

        for (int tableNumber = 1; tableNumber <= 8; tableNumber++) {
            RestaurantTable table = new RestaurantTable();
            table.setRestaurant(restaurant);
            table.setTableNumber(tableNumber);
            table.setTableCode(generateTableCode(restaurant.getId(), tableNumber));
            tableRepository.save(table);
        }

        Category starters = createCategory(restaurant, "Başlangıçlar", "Paylaşımlık ve hafif lezzetler", 1);
        Category mains = createCategory(restaurant, "Ana Yemekler", "Restoranın öne çıkan tabakları", 2);
        Category drinks = createCategory(restaurant, "İçecekler", "Soğuk ve sıcak içecekler", 3);
        Category desserts = createCategory(restaurant, "Tatlılar", "Yemek sonrası tatlılar", 4);

        createProduct(restaurant, starters, "Mercimek Çorbası", "Günlük hazırlanan klasik çorba", "95.00", 1, "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80");
        createProduct(restaurant, starters, "Patates Kızartması", "Baharatlı çıtır patates", "120.00", 2, "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=80");
        createProduct(restaurant, mains, "Izgara Köfte", "Pilav ve salata ile servis edilir", "285.00", 1, "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80");
        createProduct(restaurant, mains, "Tavuk Şiş", "Lavaş, salata ve sos ile servis edilir", "260.00", 2, "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80");
        createProduct(restaurant, drinks, "Ayran", "Soğuk servis edilir", "45.00", 1, "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80");
        createProduct(restaurant, drinks, "Limonata", "Ev yapımı limonata", "75.00", 2, "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80");
        createProduct(restaurant, desserts, "Sütlaç", "Fırında sütlaç", "110.00", 1, "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80");
        createProduct(restaurant, desserts, "Cheesecake", "Frambuaz soslu", "145.00", 2, "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80");

        User admin = new User();
        admin.setRestaurant(restaurant);
        admin.setEmail("serhanbozdemir3444@gmail.com");
        admin.setFullName("Serhan Bozdemir");
        admin.setPasswordHash(passwordEncoder.encode("1"));
        admin.setRole(UserRole.ADMIN);
        userRepository.save(admin);
    }

    private Category createCategory(Restaurant restaurant, String name, String description, int sortOrder) {
        Category category = new Category();
        category.setRestaurant(restaurant);
        category.setName(name);
        category.setDescription(description);
        category.setSortOrder(sortOrder);
        return categoryRepository.save(category);
    }

    private void createProduct(Restaurant restaurant, Category category, String name, String description, String price, int sortOrder, String imageUrl) {
        Product product = new Product();
        product.setRestaurant(restaurant);
        product.setCategory(category);
        product.setName(name);
        product.setDescription(description);
        product.setPrice(new BigDecimal(price));
        product.setImageUrl(imageUrl);
        product.setSortOrder(sortOrder);
        productRepository.save(product);
    }

    private void normalizeDemoTurkishData() {
        restaurantRepository.findAll().forEach(restaurant -> {
            if ("Demo Restaurant".equals(restaurant.getName()) || "Demo Restoran".equals(restaurant.getName())) {
                restaurant.setName("Semua Restorant");
                restaurant.setAddress("İstanbul");
            }
        });

        categoryRepository.findAll().forEach(category -> {
            if ("Baslangiclar".equals(category.getName())) {
                category.setName("Başlangıçlar");
                category.setDescription("Paylaşımlık ve hafif lezzetler");
            } else if ("Restoranin one cikan tabaklari".equals(category.getDescription())) {
                category.setDescription("Restoranın öne çıkan tabakları");
            } else if ("Icecekler".equals(category.getName())) {
                category.setName("İçecekler");
                category.setDescription("Soğuk ve sıcak içecekler");
            } else if ("Tatlilar".equals(category.getName())) {
                category.setName("Tatlılar");
                category.setDescription("Yemek sonrası tatlılar");
            }
        });

        productRepository.findAll().forEach(product -> {
            switch (product.getName()) {
                case "Mercimek Corbasi" -> {
                    product.setName("Mercimek Çorbası");
                    product.setDescription("Günlük hazırlanan klasik çorba");
                    product.setImageUrl("https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80");
                }
                case "Patates Kizartmasi" -> {
                    product.setName("Patates Kızartması");
                    product.setDescription("Baharatlı çıtır patates");
                    product.setImageUrl("https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=80");
                }
                case "Izgara Kofte" -> {
                    product.setName("Izgara Köfte");
                    product.setImageUrl("https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80");
                }
                case "Tavuk Sis" -> {
                    product.setName("Tavuk Şiş");
                    product.setDescription("Lavaş, salata ve sos ile servis edilir");
                    product.setImageUrl("https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80");
                }
                case "Limonata" -> {
                    product.setDescription("Ev yapımı limonata");
                    product.setImageUrl("https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80");
                }
                case "Cheesecake" -> product.setImageUrl("https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80");
                case "Sutlac" -> {
                    product.setName("Sütlaç");
                    product.setDescription("Fırında sütlaç");
                    product.setImageUrl("https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80");
                }
                default -> {
                    if ("Ayran".equals(product.getName())) {
                        product.setDescription("Soğuk servis edilir");
                        product.setImageUrl("https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80");
                    }
                }
            }
        });

        userRepository.findByEmail("admin@qrmenu.local")
                .filter(user -> user.getPasswordHash() == null || !user.getPasswordHash().startsWith("$2"))
                .ifPresent(user -> user.setPasswordHash(passwordEncoder.encode("admin123")));
    }

    private String generateTableCode(Long restaurantId, Integer tableNumber) {
        String code;
        do {
            byte[] bytes = new byte[4];
            secureRandom.nextBytes(bytes);
            code = "r" + restaurantId + "-t" + tableNumber + "-" + HexFormat.of().formatHex(bytes);
        } while (tableRepository.existsByTableCode(code));
        return code;
    }
}
