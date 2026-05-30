CREATE TABLE feedbacks (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id),
    table_id BIGINT NOT NULL REFERENCES restaurant_tables(id),
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    food_rating INTEGER NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
    service_rating INTEGER NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
    speed_rating INTEGER NOT NULL CHECK (speed_rating BETWEEN 1 AND 5),
    cleanliness_rating INTEGER NOT NULL CHECK (cleanliness_rating BETWEEN 1 AND 5),
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    comment VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_feedbacks_order UNIQUE (order_id)
);

CREATE INDEX idx_feedbacks_restaurant_created ON feedbacks(restaurant_id, created_at DESC);
