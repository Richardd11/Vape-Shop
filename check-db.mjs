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

console.log('Total products:', data.length);
console.log('Without image_url:', data.filter(p => !p.image_url).length);
console.log('With image_url:', data.filter(p => p.image_url).length);

// Show all products and their image_url
data.forEach(p => {
  const hasImg = p.image_url ? 'YES' : 'NO ';
  console.log(hasImg, '|', p.sku?.padEnd(25), '|', (p.image_url || '(none)').substring(0, 80));
});
