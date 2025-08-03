// Lokasi file: src/electron/database.js
// Deskripsi: Skema database v2 dengan kolom 'base_quantity' dan 'base_unit'.

const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const log = require('electron-log');

const dbPath = path.join(app.getPath('userData'), 'defood.db');
const LATEST_DB_VERSION = 2;
let db;

function initializeDatabase() {
    try {
        db = new Database(dbPath, { verbose: console.log });
        log.info('Database terhubung di', dbPath);

        db.pragma('foreign_keys = ON');

        let currentVersion = db.pragma('user_version', { simple: true });
        log.info(`Versi DB saat ini: ${currentVersion}, Versi DB terbaru: ${LATEST_DB_VERSION}`);

        if (currentVersion < LATEST_DB_VERSION) {
            log.info('Skema database perlu dibuat/dimigrasi...');
            runMigrations(currentVersion);
            log.info('Migrasi berhasil diselesaikan.');
        }

        log.info("Inisialisasi database selesai.");
        return db;
    } catch (error) {
        log.error('Inisialisasi database gagal:', error);
        throw error;
    }
}

function runMigrations(currentVersion) {
    if (currentVersion < 1) {
        log.info('Migrasi ke v1: Membuat skema database awal...');
        try {
            db.transaction(() => {
                db.exec(`
                    CREATE TABLE foods (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL UNIQUE,
                        serving_size_g REAL DEFAULT 100,
                        calories_kcal REAL DEFAULT 0,
                        carbs_g REAL DEFAULT 0,
                        protein_g REAL DEFAULT 0,
                        fat_g REAL DEFAULT 0,
                        fiber_g REAL DEFAULT 0,
                        price_per_100g REAL DEFAULT 0,
                        category TEXT,
                        usage_count INTEGER DEFAULT 0,
                        unit_conversions TEXT,
                        created_at TEXT NOT NULL
                    );
                    CREATE TABLE recipes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT,
                        instructions TEXT,
                        servings INTEGER DEFAULT 1,
                        cost_operational_recipe REAL DEFAULT 0,
                        cost_labor_recipe REAL DEFAULT 0,
                        margin_percent REAL DEFAULT 50,
                        created_at TEXT NOT NULL
                    );
                    CREATE TABLE recipe_ingredients (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        recipe_id INTEGER NOT NULL,
                        food_id INTEGER NOT NULL,
                        quantity REAL NOT NULL,
                        unit TEXT NOT NULL DEFAULT 'g',
                        display_order INTEGER,
                        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
                        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
                    );
                    CREATE TABLE settings (
                        key TEXT PRIMARY KEY,
                        value TEXT
                    );
                `);
            })();
            log.info('Skema database v1 berhasil dibuat.');
        } catch (err) {
            log.error('Gagal membuat skema database awal:', err);
            throw err;
        }
    }
    
    if (currentVersion < 2) {
        log.info('Migrasi ke v2: Menambahkan kolom satuan dasar ke tabel foods...');
        try {
            db.transaction(() => {
                db.exec(`ALTER TABLE foods ADD COLUMN base_quantity REAL DEFAULT 100;`);
                db.exec(`ALTER TABLE foods ADD COLUMN base_unit TEXT DEFAULT 'gram';`);
            })();
            log.info('Kolom base_quantity dan base_unit berhasil ditambahkan.');
        } catch (err) {
            log.error('Gagal migrasi database ke v2:', err);
            throw err;
        }
    }

    db.pragma(`user_version = ${LATEST_DB_VERSION}`);
}

function getDbInstance() {
    if (!db) {
        throw new Error("Database belum diinisialisasi.");
    }
    db.runAsync = (sql, params = []) => db.prepare(sql).run(params);
    db.getAsync = (sql, params = []) => db.prepare(sql).get(params);
    db.allAsync = (sql, params = []) => db.prepare(sql).all(params);
    return db;
}

function closeDatabase() {
    if (db) {
        db.close();
        log.info('Koneksi database berhasil ditutup.');
    }
}

module.exports = { initializeDatabase, getDbInstance, closeDatabase };
