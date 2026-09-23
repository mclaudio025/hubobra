class SupabaseConfig {
  static const String supabaseUrl = 'https://zeywqzkmevytzkdbzwni.supabase.co';
  
  static const String supabaseAnonKey = 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDgwNzMsImV4cCI6MjEwNTIyNDA3M30.-gik4rAZTu8uofZV3pq55KH3m8dCvx1r7t7x98KQYpA';

  // Table Names matching PostgreSQL schema
  static const String productsTable = 'products';
  static const String categoriesTable = 'categories';
  static const String productImagesTable = 'product_images';
  
  // Storage Bucket
  static const String storageBucket = 'products';
}
