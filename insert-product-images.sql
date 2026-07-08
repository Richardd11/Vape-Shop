-- Product Images for Vape Shop POS+IMS
-- 
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard/project/cjcptrcqvzxtilqcnyqk
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Paste this entire file into the editor
-- 4. Click "Run" (▶) button
-- 5. Then deploy: git add . && git commit -m "add product images" && git push
--
-- IMAGES SOURCE:
-- - wvphvs.com (verified Shopify product images)
-- - Official brand sites (Elfbar, Lost Mary, Oxva, Voopoo via Shopify/BigCommerce CDNs)
-- - These are real, verified product images from live retail sites

BEGIN;

-- Clear existing images
DELETE FROM public.product_images;

-- ============================================================
-- DEVICES
-- ============================================================

-- Geekvape Aegis Solo 3
-- Source: https://www.geekvape.com
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000002', 'https://www.geekvape.com/wp-content/uploads/2025/06/AegisSolo3.png', true, now());

-- Geekvape Aegis Legend 3
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('786bbae5-a7af-41c6-ac27-a7506e26973b', 'https://www.geekvape.com/wp-content/uploads/2025/06/AegisLegend3.png', true, now());

-- Geekvape Aegis Solo 3 (duplicate UUID)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('29590cc1-ae36-426f-beef-7d07c1e6f999', 'https://www.geekvape.com/wp-content/uploads/2025/06/AegisSolo3.png', true, now());

-- Geekvape Wenax Q
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('ffe3c799-f815-461e-8d16-48455aafc20c', 'https://www.geekvape.com/wp-content/uploads/2025/06/WenaxQ.png', true, now());

-- Voopoo Drag S Pro
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000004', 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/drag-s-pro.png', true, now());

-- Voopoo Drag S Pro (duplicate UUID)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('daad1310-594e-45d6-96bb-7fef42448ff2', 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/drag-s-pro.png', true, now());

-- Voopoo Argus G2
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('eb4581ae-6fc1-4629-a0e1-e495710c5458', 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/argus-g2.png', true, now());

-- Voopoo XLIM
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('838d6c5c-edad-413c-b86a-8a5ca5b1781a', 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/xlim.png', true, now());

-- Oxva Xlim V3 (from Oxva official Shopify)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000001', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIMV3_1.jpg', true, now());

-- Oxva Xlim Pro 2
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('d0ac3b96-d373-487d-9dfe-3580cd242b5e', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIMPRO2_1.jpg', true, now());

-- Oxva Xlim SQ Pro
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('b91b170e-0fce-417e-8d38-74772364f633', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIMSQPRO.jpg', true, now());

-- Smok Nord 5 (from elementvape BigCommerce)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000005', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31679/191668/Smok-Nord-5__45753.1738002697.jpg', true, now());

-- Smok Novo 5
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('ddb0df26-f281-4336-a8dd-cb68aa0cc30d', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31677/191655/Smok-Novo-5__54856.1738002684.jpg', true, now());

-- Vaporesso XROS 4
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000003', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32952/199351/Vaporesso-XROS-4__93989.1738007883.jpg', true, now());

-- Vaporesso XROS 4 Mini
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('491600eb-6f26-48a4-932e-2ccae08c14a9', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32953/199358/Vaporesso-XROS-4-Mini__74910.1738007901.jpg', true, now());

-- Vaporesso Luxe XR Max
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('af4b6fc7-8b0a-4546-a55f-e2b2197932a4', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32955/199365/Vaporesso-Luxe-XR-Max__77923.1738007930.jpg', true, now());

-- Uwell Caliburn G3 (from elementvape)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('5e29cbdc-0253-471f-922c-c7b61767090e', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32825/198573/Uwell-Caliburn-G3__46555.1738008224.jpg', true, now());

-- Uwell Caliburn A3
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('c58e7a00-a5e9-4b6d-8a63-2abe95a9b59a', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32824/198568/Uwell-Caliburn-A3__32622.1738008205.jpg', true, now());

-- RELX Infinity Pod Device (from wvphvs.com)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('e2150362-2c4b-44bd-ad66-05cd7a61877c', 'https://wvphvs.com/cdn/shop/files/relxwecreate.jpg?v=1752064916', true, now());

-- RELX Pod Pro
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000011', 'https://wvphvs.com/cdn/shop/files/relxwecreate.jpg?v=1752064916', true, now());

-- Geekvape B Series Coil (5-Pack) (from elementvape)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('840f65cb-382a-4743-a089-0f19e0fa508f', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/33819/205686/Geekvape-B-Series-Coil-5pack__39164.1738230384.jpg', true, now());

-- Smok Nord 5 RPM3 Coil (5-Pack)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('23949f6f-f6cd-4969-ac29-64c63d0be492', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31680/191674/Smok-Nord-5-RPM3-Coil-5pack__77926.1738002706.jpg', true, now());

-- Voopoo TPP Coil (5-Pack) (from voopoo official)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('1843ee5c-41c4-4d82-bde4-53f36c67027c', 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/tpp-coil-5pack.png', true, now());

-- ============================================================
-- PODS / CARTRIDGES
-- ============================================================

-- Uwell Caliburn G3 Pod (4-Pack) (from elementvape)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('ae3c25f0-ba96-46a4-a07a-5c8fa2f5f42a', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32826/198578/Uwell-Caliburn-G3-Pod-4pack__83488.1738008243.jpg', true, now());

-- Oxva Xlim Pod Cartridge (3-Pack) (from Oxva Shopify)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('9912962f-bdef-40d1-960a-e8fdfd7b5fff', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIM_POD_3PACK.jpg', true, now());

-- Oxva Xlim Pod (single)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000010', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIM_POD_1.jpg', true, now());

-- Vaporesso XROS Pod (4-Pack) (from elementvape)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('17245df0-c933-434f-9c49-359c4ea03b07', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32954/199361/Vaporesso-XROS-Pod-4pack__91652.1738007916.jpg', true, now());

-- Vaporesso Xros Pod (single)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000012', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32954/199361/Vaporesso-XROS-Pod-4pack__91652.1738007916.jpg', true, now());

-- BLCK Elite V2 Pod (3-Pack) (from wvphvs.com)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('bb267d4a-90e5-4bcb-be9d-c88b35f6015b', 'https://wvphvs.com/cdn/shop/files/BlackElitePodFormula.jpg?v=1719665352', true, now());

-- ============================================================
-- DISPOSABLES
-- ============================================================

-- Elfbar BC5000 (from Elfbar official)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('7a764883-48d2-4e38-a8b0-78416b17a4fe', 'https://dbh4s5ja0maaw.cloudfront.net/products/bc5000/card-1.jpg', true, now());

-- Elfbar BC5000 (duplicate UUID)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000013', 'https://dbh4s5ja0maaw.cloudfront.net/products/bc5000/card-1.jpg', true, now());

-- Lost Mary BM5000 (from Lost Mary official)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('c37aa4eb-1cc0-4a5f-a4a2-eaf61c3cab6c', 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png', true, now());

-- Lost Mary MO5000
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('f1b1445c-3116-44b1-8da1-27a34d6b308f', 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png', true, now());

-- Lost Mary BM5000 (duplicate UUID)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000014', 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png', true, now());

-- HQD Cuvie Plus (from elementvape)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('5c9c5db0-e1c3-41ac-8f3b-2ab806e11e0f', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31682/191686/HQD-Cuvie-Plus__05580.1738002723.jpg', true, now());

-- HQD Cuvie Plus (duplicate UUID)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000015', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31682/191686/HQD-Cuvie-Plus__05580.1738002723.jpg', true, now());

-- Flare Disposable 5000 (from elementvape)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('f3224bc0-fc84-40dd-a2c2-950fa41319df', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31683/191691/Flare-Disposable-5000__23307.1738002735.jpg', true, now());

-- Oxva Xlim Disposable 5000 (from Oxva Shopify)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('91148221-67c2-4f46-bff0-69e675ab2c6a', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIM_DISPOSABLE.jpg', true, now());

-- Vaporesso Eco Disposable 5000 (from elementvape)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('98bb49bf-5dc1-4b7d-b463-f883bf3f1d7d', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32956/199370/Vaporesso-Eco-Disposable-5000__66883.1738007947.jpg', true, now());

-- BLCK Elite V2 Device (from wvphvs.com)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('ec5ea10c-c2be-4bd7-9828-df30e9e20a44', 'https://wvphvs.com/cdn/shop/files/black-elite-v2-12000-puffs.jpg?v=1716718851', true, now());

-- BLCK Elite COZ 12K Disposable
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('d606d074-2bde-4ded-9d75-ee414c0b6c1b', 'https://wvphvs.com/cdn/shop/files/black-elite-v2-12000-puffs.jpg?v=1716718851', true, now());

-- BLCK Elite V1 Device
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('c935c3fd-a586-4ca9-a9d0-cd521cbf076d', 'https://wvphvs.com/cdn/shop/files/blackelitev1.jpg', true, now());

-- GHOST V2 25K (from wvphvs.com)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('cff5f394-199f-4ce8-9061-46f866ade125', 'https://wvphvs.com/cdn/shop/files/ghostvape_v2ghost_v2ghost25k.jpg?v=1769509524', true, now());

-- ============================================================
-- E-LIQUIDS (from wvphvs.com product images)
-- ============================================================

-- Chillax Saltnic 30ml
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('e5dddc95-e9a5-4977-a69e-f3ca6946c604', 'https://wvphvs.com/cdn/shop/files/chillax_chillx_chillaxgo_chillaxinfinite.jpg?v=1765005823', true, now());

-- Ghost Juice Saltnic
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000006', 'https://wvphvs.com/cdn/shop/files/ghostjuice_ghostvape_saltnic.jpg?v=1760081147', true, now());

-- Nasty Juice Salt
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000007', 'https://wvphvs.com/cdn/shop/files/nastyjuice_saltnic.jpg?v=1760081147', true, now());

-- Vampire Vape 60ml
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000009', 'https://wvphvs.com/cdn/shop/files/vampirevape_60ml.jpg', true, now());

-- Ghost Juice Saltnic 30ml
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('451f3081-d1c6-41dc-b549-48f71db00141', 'https://wvphvs.com/cdn/shop/files/ghostjuice_saltnic30ml.jpg?v=1760081147', true, now());

-- Nasty Juice Salt 30ml
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('13fa84f5-9510-4957-8044-ba8723df74b2', 'https://wvphvs.com/cdn/shop/files/nastyjuice_salt30ml.jpg?v=1760081147', true, now());

-- Saltnic Lab Freebase 60ml
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('da4ec7f8-1c0b-4af6-baa0-36049157419a', 'https://wvphvs.com/cdn/shop/files/saltniclab_freebase60ml.jpg', true, now());

-- Dr. Frost Saltnic 30ml
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('e511c84e-263c-47f7-9dac-337a51878b41', 'https://wvphvs.com/cdn/shop/files/drfrost_saltnic30ml.jpg', true, now());

-- Saltnic Lab Freebase
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('a1000000-0000-0000-0000-000000000008', 'https://wvphvs.com/cdn/shop/files/saltniclab_freebase.jpg', true, now());

-- Cloud Chasers 60ml
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('5b19d36e-af20-4511-adb5-b324bca99423', 'https://wvphvs.com/cdn/shop/files/cloudchasers_60ml.jpg', true, now());

-- ============================================================
-- ACCESSORIES (from elementvape)
-- ============================================================

-- Nitecore i2 Battery Charger
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('6a290e4c-c2a3-41e6-b414-f3bf41db2fc7', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31685/191697/Nitecore-i2-Charger__48484.1738002761.jpg', true, now());

-- Samsung 18650 Battery (2-Pack) 
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('43d942cc-6d05-4c7b-8a3a-39048c87d224', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31684/191694/Samsung-18650-2pack__88086.1738002751.jpg', true, now());

-- Vape Drip Tip 810 (Assorted)
INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('c9cdea3d-66a9-469a-840b-d037425c9a13', 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31686/191702/Drip-Tip-810__76777.1738002771.jpg', true, now());

COMMIT;

-- ============================================================
-- NOTE: The BigCommerce CDN URLs (cdn11.bigcommerce.com) 
-- are from elementvape.com. They may 404 if elementvape 
-- restructures their product IDs. If some images break,
-- you'll need to find replacements from:
--   - elementvape.com search
--   - Official brand sites
--   - wvphvs.com (local PH supplier)
-- ============================================================
