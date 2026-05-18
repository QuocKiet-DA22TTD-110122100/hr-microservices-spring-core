-- Keep seed deterministic so local environments always start from the same baseline.
DELETE FROM user_password_history;
DELETE FROM users;
DELETE FROM user_sync_outbox;
DELETE FROM user_sync_dlq;

INSERT INTO users (id, username, password_hash, role, password_updated_at)
VALUES (
    '28759924-7b71-4220-bf8d-06d64ce7cae6',
    'admin',
    '$argon2id$v=19$m=16384,t=2,p=1$3zit5FvTfQtRZqBWj7SAnw$hnJaphivlZw+HLkMM4tTZ8UZhEbj8NAoiA8/g6eGGNA',
    'ADMIN',
    CURRENT_TIMESTAMP
);

INSERT INTO user_password_history (id, user_id, password_hash, created_at)
VALUES (
    '5b6f808e-9cae-4f2d-8a9f-d0f3e25f68cf',
    '28759924-7b71-4220-bf8d-06d64ce7cae6',
    '$argon2id$v=19$m=16384,t=2,p=1$3zit5FvTfQtRZqBWj7SAnw$hnJaphivlZw+HLkMM4tTZ8UZhEbj8NAoiA8/g6eGGNA',
    CURRENT_TIMESTAMP
);
