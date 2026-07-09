import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cjcptrcqvzxtilqcnyqk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqY3B0cmNxdnp4dGlscWNueXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODUxOTEsImV4cCI6MjA5NjA2MTE5MX0.aDKjdBsV0rktWLWE5SYIvzBK7qVp_-0dgXFyC39EqmU'
);

const { data, error } = await supabase
  .from('products_with_stock')
  .select('id, name, sku, image_url')
  .order('name');

if (error) {
  console.error('ERROR:', error);
  process.exit(1);
}

// Check for proper file extension
data.forEach(p => {
  const url = p.image_url || '';
  const hasExt = /\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(url);
  console.log(
    (hasExt ? 'OK' : 'NO-EXT'),
    '|',
    (p.sku || '').padEnd(25),
    '|',
    url
  );
});
