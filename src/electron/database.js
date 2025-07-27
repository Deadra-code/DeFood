// Lokasi file: src/electron/database.js
// Deskripsi: Migrasi ke v8 untuk menambahkan 'unit_conversions' ke tabel foods.

const { app } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const log = require('electron-log');

const dbPath = path.join(app.getPath('userData'), 'defood_v2.db');
const LATEST_DB_VERSION = 8; // Versi dinaikkan ke 8
let db;

function promisifyDb(dbInstance) {
    dbInstance.runAsync = (sql, params = []) => new Promise((resolve, reject) => {
        dbInstance.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
    dbInstance.getAsync = (sql, params = []) => new Promise((resolve, reject) => {
        dbInstance.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    dbInstance.allAsync = (sql, params = []) => new Promise((resolve, reject) => {
        dbInstance.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
    return dbInstance;
}

async function runMigrations(currentVersion) {
    // Migrasi v1: Pembuatan tabel awal
    if (currentVersion < 1) {
        log.info('Migration to v1: Creating initial tables...');
        await db.runAsync(`CREATE TABLE IF NOT EXISTS foods (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, serving_size_g REAL DEFAULT 100, calories_kcal REAL DEFAULT 0, carbs_g REAL DEFAULT 0, protein_g REAL DEFAULT 0, fat_g REAL DEFAULT 0, fiber_g REAL DEFAULT 0, price INTEGER DEFAULT 0, price_unit TEXT, created_at TEXT NOT NULL)`);
        await db.runAsync(`CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, instructions TEXT, created_at TEXT NOT NULL)`);
        await db.runAsync(`CREATE TABLE IF NOT EXISTS recipe_ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL, food_id INTEGER NOT NULL, quantity_g REAL NOT NULL, FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE, FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE)`);
        await db.runAsync(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
    }
    
    // Migrasi v2: Penambahan kolom image_url
    if (currentVersion < 2) {
        log.info('Migration to v2: Adding image_url columns...');
        try {
            await db.runAsync(`ALTER TABLE foods ADD COLUMN image_url TEXT`);
            await db.runAsync(`ALTER TABLE recipes ADD COLUMN image_url TEXT`);
        } catch (err) { if (!err.message.includes('duplicate column name')) throw err; }
    }

    // Migrasi v3: Penambahan kolom display_order
    if (currentVersion < 3) {
        log.info('Migration to v3: Adding display_order to recipe_ingredients...');
        try {
            await db.runAsync(`ALTER TABLE recipe_ingredients ADD COLUMN display_order INTEGER`);
        } catch (err) { if (!err.message.includes('duplicate column name')) throw err; }
    }

    // Migrasi v4: Refaktor database untuk simplisitas
    if (currentVersion < 4) {
        log.info('Migration to v4: Refactoring database for simplicity...');
        await db.runAsync('PRAGMA foreign_keys=off;');
        await db.runAsync('BEGIN TRANSACTION;');
        try {
            // Refaktor tabel `foods`
            await db.runAsync(`CREATE TABLE foods_new (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, serving_size_g REAL DEFAULT 100, calories_kcal REAL DEFAULT 0, carbs_g REAL DEFAULT 0, protein_g REAL DEFAULT 0, fat_g REAL DEFAULT 0, price_per_100g REAL DEFAULT 0, created_at TEXT NOT NULL)`);
            await db.runAsync(`INSERT INTO foods_new (id, name, serving_size_g, calories_kcal, carbs_g, protein_g, fat_g, price_per_100g, created_at) SELECT id, name, serving_size_g, calories_kcal, carbs_g, protein_g, fat_g, price, created_at FROM foods`);
            await db.runAsync('DROP TABLE foods');
            await db.runAsync('ALTER TABLE foods_new RENAME TO foods');
            
            // Refaktor tabel `recipes`
            await db.runAsync(`CREATE TABLE recipes_new (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, instructions TEXT, created_at TEXT NOT NULL)`);
            await db.runAsync(`INSERT INTO recipes_new (id, name, description, instructions, created_at) SELECT id, name, description, instructions, created_at FROM recipes`);
            await db.runAsync('DROP TABLE recipes');
            await db.runAsync('ALTER TABLE recipes_new RENAME TO recipes');

            // Hapus tabel `settings`
            await db.runAsync('DROP TABLE IF EXISTS settings');

            await db.runAsync('COMMIT;');
        } catch(err) {
            await db.runAsync('ROLLBACK;');
            log.error('v4 Migration failed, rolling back changes.', err);
            throw err;
        } finally {
            await db.runAsync('PRAGMA foreign_keys=on;');
        }
    }

    // Migrasi v5: Peningkatan fitur tabel foods
    if (currentVersion < 5) {
        log.info('Migration to v5: Enhancing foods table...');
        try {
            await db.runAsync(`ALTER TABLE foods ADD COLUMN category TEXT`);
            await db.runAsync(`ALTER TABLE foods ADD COLUMN usage_count INTEGER DEFAULT 0`);
            log.info('v5: Columns category and usage_count added successfully.');
        } catch (err) {
            if (!err.message.includes('duplicate column name')) {
                log.error('v5 Migration failed:', err);
                throw err;
            } else {
                log.warn('v5: Columns already exist, skipping alteration.');
            }
        }
    }

    // Migrasi v6: Menambahkan fitur kalkulasi biaya
    if (currentVersion < 6) {
        log.info('Migration to v6: Adding business calculation features...');
        try {
            await db.runAsync(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
            await db.runAsync(`ALTER TABLE recipes ADD COLUMN cost_hpp REAL DEFAULT 0`);
            await db.runAsync(`ALTER TABLE recipes ADD COLUMN cost_margin REAL`);
            await db.runAsync(`ALTER TABLE recipes ADD COLUMN cost_operational REAL`);
            await db.runAsync(`ALTER TABLE recipes ADD COLUMN cost_labor REAL`);
        } catch (err) {
            if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) throw err;
        }
    }

    if (currentVersion < 7) {
        log.info('Migration to v7: Adding fiber and unit support...');
        await db.runAsync('BEGIN TRANSACTION');
        try {
            await db.runAsync(`ALTER TABLE foods ADD COLUMN fiber_g REAL DEFAULT 0`);
            await db.runAsync(`CREATE TABLE recipe_ingredients_new (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL, food_id INTEGER NOT NULL, quantity REAL NOT NULL, unit TEXT NOT NULL DEFAULT 'g', display_order INTEGER, FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE, FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE)`);
            const columns = await db.allAsync("PRAGMA table_info(recipe_ingredients)");
            if (columns.some(col => col.name === 'quantity_g')) {
                 await db.runAsync(`INSERT INTO recipe_ingredients_new (id, recipe_id, food_id, quantity, unit, display_order) SELECT id, recipe_id, food_id, quantity_g, 'g', display_order FROM recipe_ingredients`);
            }
            await db.runAsync('DROP TABLE recipe_ingredients');
            await db.runAsync('ALTER TABLE recipe_ingredients_new RENAME TO recipe_ingredients');
            await db.runAsync('COMMIT');
            log.info('v7: Fiber and unit support added successfully.');
        } catch (err) {
            await db.runAsync('ROLLBACK');
            if (!err.message.includes('duplicate column name')) throw err;
        }
    }

    // (BARU) Migrasi v8: Menambahkan kolom konversi satuan
    if (currentVersion < 8) {
        log.info('Migration to v8: Adding unit conversions column...');
        try {
            await db.runAsync(`ALTER TABLE foods ADD COLUMN unit_conversions TEXT`);
        } catch (err) {
            if (!err.message.includes('duplicate column name')) {
                log.error('v8 Migration failed:', err);
                throw err;
            } else {
                log.warn('v8: Column unit_conversions already exists, skipping.');
            }
        }
    }
    
    await db.runAsync(`PRAGMA user_version = ${LATEST_DB_VERSION}`);
}

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        let dbInstance = new sqlite3.Database(dbPath, async (err) => {
            if (err) {
                log.error('Error opening database', err.message);
                return reject(err);
            }
            log.info('Database connected at', dbPath);
            db = promisifyDb(dbInstance);
            try {
                await db.runAsync('PRAGMA foreign_keys = ON;');
                const row = await db.getAsync('PRAGMA user_version');
                const currentVersion = row ? row.user_version : 0;
                log.info(`Current DB version: ${currentVersion}, Latest DB version: ${LATEST_DB_VERSION}`);
                if (currentVersion < LATEST_DB_VERSION) {
                    log.info('Database schema is outdated. Running migrations...');
                    await runMigrations(currentVersion);
                    log.info('Migrations completed successfully.');
                }
                log.info("Database initialization complete.");
                resolve(db);
            } catch (error) {
                log.error('Database initialization failed:', error);
                reject(error);
            }
        });
    });
}

function getDbInstance() { return db; }
function closeDatabase() { if (db) { db.close(); } }

module.exports = { initializeDatabase, getDbInstance, closeDatabase };

