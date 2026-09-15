import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', process.env.DATABASE_PATH || 'database/legontv.db');

let db = null;

export function getDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

export async function initializeDatabase() {
  const database = await getDatabase();

  return new Promise((resolve, reject) => {
    database.serialize(() => {
      // Admins table
      database.run(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating admins table:', err);
      });

      // Blog posts table
      database.run(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          content TEXT NOT NULL,
          excerpt TEXT,
          featured_image TEXT,
          category_id INTEGER,
          author_id INTEGER,
          status TEXT DEFAULT 'draft',
          published_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id),
          FOREIGN KEY (author_id) REFERENCES authors(id)
        )
      `, (err) => {
        if (err) console.error('Error creating blog_posts table:', err);
      });

      // Categories table
      database.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating categories table:', err);
      });

      // Authors table
      database.run(`
        CREATE TABLE IF NOT EXISTS authors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          bio TEXT,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating authors table:', err);
      });

      // Products table
      database.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          category_id INTEGER,
          image TEXT,
          stock INTEGER DEFAULT 0,
          is_available BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES product_categories(id)
        )
      `, (err) => {
        if (err) console.error('Error creating products table:', err);
      });

      // Product categories table
      database.run(`
        CREATE TABLE IF NOT EXISTS product_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating product_categories table:', err);
      });

      // Orders table
      database.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT UNIQUE NOT NULL,
          customer_email TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          total_amount REAL NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating orders table:', err);
      });

      // Order items table
      database.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `, (err) => {
        if (err) console.error('Error creating order_items table:', err);
      });

      // Sponsors table
      database.run(`
        CREATE TABLE IF NOT EXISTS sponsors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          logo TEXT,
          description TEXT,
          website_url TEXT,
          level TEXT DEFAULT 'standard',
          display_order INTEGER,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating sponsors table:', err);
      });

      // Site settings table
      database.run(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating site_settings table:', err);
          reject(err);
        } else {
          console.log('✓ All database tables created/verified');
          resolve();
        }
      });
    });
  });
}

export function runAsync(query, params = []) {
  return new Promise(async (resolve, reject) => {
    const database = await getDatabase();
    database.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function getAsync(query, params = []) {
  return new Promise(async (resolve, reject) => {
    const database = await getDatabase();
    database.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function allAsync(query, params = []) {
  return new Promise(async (resolve, reject) => {
    const database = await getDatabase();
    database.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
