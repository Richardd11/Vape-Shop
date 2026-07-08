CREATE OR REPLACE FUNCTION public.reset_product_images()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  DELETE FROM public.product_images;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.reset_product_images TO anon, authenticated;
