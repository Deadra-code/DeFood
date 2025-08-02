// Lokasi file: src/electron/database.js
// Deskripsi: Versi final dengan nama database baru (defood.db) dan skema migrasi yang disatukan.

const { app } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const log = require('electron-log');

// --- PERUBAHAN 1: Nama file database diubah ---
const dbPath = path.join(app.getPath('userData'), 'defood.db');
// --- PERUBAHAN 2: Versi database disetel ke 1 untuk rilis baru ---
const LATEST_DB_VERSION = 1;
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

// --- PERUBAHAN 3: Semua migrasi digabung menjadi satu skema awal ---
async function runMigrations(currentVersion) {
    if (currentVersion < 1) {
        log.info('Migrasi ke v1: Membuat skema database awal...');
        await db.runAsync('BEGIN TRANSACTION;');
        try {
            // Tabel Foods (menggabungkan semua kolom dari migrasi sebelumnya)
            await db.runAsync(`
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
                )
            `);

            // Tabel Recipes (menggabungkan semua kolom dari migrasi sebelumnya)
            await db.runAsync(`
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
                )
            `);

            // Tabel Recipe Ingredients (menggabungkan semua kolom dari migrasi sebelumnya)
            await db.runAsync(`
                CREATE TABLE recipe_ingredients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    recipe_id INTEGER NOT NULL,
                    food_id INTEGER NOT NULL,
                    quantity REAL NOT NULL,
                    unit TEXT NOT NULL DEFAULT 'g',
                    display_order INTEGER,
                    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
                    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
                )
            `);

            // Tabel Settings
            await db.runAsync(`
                CREATE TABLE settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            `);

            await db.runAsync('COMMIT;');
            log.info('Skema database v1 berhasil dibuat.');
        } catch (err) {
            await db.runAsync('ROLLBACK;');
            log.error('Gagal membuat skema database awal:', err);
            throw err;
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
                    log.info('Skema database perlu dibuat/dimigrasi...');
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

function closeDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    log.error('Gagal menutup database:', err.message);
                    reject(err);
                } else {
                    log.info('Koneksi database berhasil ditutup.');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

module.exports = { initializeDatabase, getDbInstance, closeDatabase };
