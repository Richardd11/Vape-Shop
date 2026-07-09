-- Restore real product images from product_images table
UPDATE products p
SET image_url = pi.url
FROM product_images pi
WHERE pi.product_id = p.id
  AND pi.url IS NOT NULL;
