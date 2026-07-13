INSERT INTO "Product" ("id", "name", "description", "sku", "price", "stockQuantity", "brand", "ai_metadata", "createdAt", "updatedAt")
VALUES ('legacy-product-preserved', 'Produto legado preservado', 'Fixture sem dados reais', 'LEGACY-KEEP', 123.45, 9, 'Marca Teste', '{"affiliate":{"checkout_url":"https://legacy.invalid/not-authorized"},"legacy":true}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Product" ("id", "name", "description", "sku", "price", "stockQuantity", "brand", "ai_metadata", "createdAt", "updatedAt")
VALUES ('legacy-echo-product', 'Echo legado de teste', 'Fixture sem dados reais', 'AMAZON-ECHO-SHOW-11-GRA', 1500.00, 3, 'Amazon', '{"affiliate":{"checkout_url":"https://legacy.invalid/echo"}}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
