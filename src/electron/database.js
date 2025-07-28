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
        log.info('Migrasi ke v1: Membuat tabel awal...');
        await db.runAsync(`CREATE TABLE IF NOT EXISTS foods (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, serving_size_g REAL DEFAULT 100, calories_kcal REAL DEFAULT 0, carbs_g REAL DEFAULT 0, protein_g REAL DEFAULT 0, fat_g REAL DEFAULT 0, fiber_g REAL DEFAULT 0, price INTEGER DEFAULT 0, price_unit TEXT, created_at TEXT NOT NULL)`);
        await db.runAsync(`CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, instructions TEXT, created_at TEXT NOT NULL)`);
        await db.runAsync(`CREATE TABLE IF NOT EXISTS recipe_ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL, food_id INTEGER NOT NULL, quantity_g REAL NOT NULL, FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE, FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE)`);
        await db.runAsync(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
    }
    
    // Migrasi v2: Penambahan kolom image_url
    if (currentVersion < 2) {
        log.info('Migrasi ke v2: Menambahkan kolom image_url...');
        try {
            await db.runAsync(`ALTER TABLE foods ADD COLUMN image_url TEXT`);
            await db.runAsync(`ALTER TABLE recipes ADD COLUMN image_url TEXT`);
        } catch (err) { if (!err.message.includes('duplicate column name')) throw err; }
    }

    // Migrasi v3: Penambahan kolom display_order
    if (currentVersion < 3) {
        log.info('Migrasi ke v3: Menambahkan display_order ke recipe_ingredients...');
        try {
            await db.runAsync(`ALTER TABLE recipe_ingredients ADD COLUMN display_order INTEGER`);
        } catch (err) { if (!err.message.includes('duplicate column name')) throw err; }
    }

    // Migrasi v4: Refaktor database untuk simplisitas
    if (currentVersion < 4) {
        log.info('Migrasi ke v4: Refactoring database untuk simplisitas...');
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
            log.error('Migrasi v4 gagal, membatalkan perubahan.', err);
            throw err;
        } finally {
            await db.runAsync('PRAGMA foreign_keys=on;');
        }
    }

    // Migrasi v5: Peningkatan fitur tabel foods
    if (currentVersion < 5) {
        log.info('Migrasi ke v5: Menyempurnakan tabel foods...');
        try {
            await db.runAsync(`ALTER TABLE foods ADD COLUMN category TEXT`);
            await db.runAsync(`ALTER TABLE foods ADD COLUMN usage_count INTEGER DEFAULT 0`);
            log.info('v5: Kolom category dan usage_count berhasil ditambahkan.');
        } catch (err) {
            if (!err.message.includes('duplicate column name')) {
                log.error('Migrasi v5 gagal:', err);
                throw err;
            } else {
                log.warn('v5: Kolom sudah ada, melewati alterasi.');
            }
        }
    }

    // Migrasi v6: Menambahkan fitur kalkulasi biaya
    if (currentVersion < 6) {
        log.info('Migrasi ke v6: Menambahkan fitur kalkulasi bisnis...');
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
        log.info('Migrasi ke v7: Menambahkan dukungan serat dan satuan...');
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
            log.info('v7: Dukungan serat dan satuan berhasil ditambahkan.');
        } catch (err) {
            await db.runAsync('ROLLBACK');
            if (!err.message.includes('duplicate column name')) throw err;
        }
    }

    // Migrasi v8: Menambahkan kolom konversi satuan
    if (currentVersion < 8) {
        log.info('Migrasi ke v8: Menambahkan kolom konversi satuan...');
        try {
            await db.runAsync(`ALTER TABLE foods ADD COLUMN unit_conversions TEXT`);
        } catch (err) {
            if (!err.message.includes('duplicate column name')) {
                log.error('Migrasi v8 gagal:', err);
                throw err;
            } else {
                log.warn('v8: Kolom unit_conversions sudah ada, melewati.');
            }
        }
    }
    
    await db.runAsync(`PRAGMA user_version = ${LATEST_DB_VERSION}`);
}

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        let dbInstance = new sqlite3.Database(dbPath, async (err) => {
            if (err) {
                log.error('Error saat membuka database', err.message);
                return reject(err);
            }
            log.info('Database terhubung di', dbPath);
            db = promisifyDb(dbInstance);
            try {
                await db.runAsync('PRAGMA foreign_keys = ON;');
                const row = await db.getAsync('PRAGMA user_version');
                const currentVersion = row ? row.user_version : 0;
                log.info(`Versi DB saat ini: ${currentVersion}, Versi DB terbaru: ${LATEST_DB_VERSION}`);
                if (currentVersion < LATEST_DB_VERSION) {
                    log.info('Skema database usang. Menjalankan migrasi...');
                    await runMigrations(currentVersion);
                    log.info('Migrasi berhasil diselesaikan.');
                }
                log.info("Inisialisasi database selesai.");
                resolve(db);
            } catch (error) {
                log.error('Inisialisasi database gagal:', error);
                reject(error);
            }
        });
    });
}

function getDbInstance() { return db; }
function closeDatabase() { if (db) { db.close(); } }

module.exports = { initializeDatabase, getDbInstance, closeDatabase };
