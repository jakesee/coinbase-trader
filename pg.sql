CREATE TABLE IF NOT EXISTS sample (
    id SERIAL PRIMARY KEY,
    created_at time,
    updated_at time,
    data jsonb
);

CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    created_at time,
    updated_at time,
    data jsonb
);
