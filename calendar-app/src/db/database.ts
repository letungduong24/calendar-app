import * as SQLite from 'expo-sqlite';

// Initialize the database
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('calendarApp.db');
  }
  return dbInstance;
};

export const initDB = async () => {
  const db = await getDB();
  
  // Set journal mode separately
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  } catch (e) {
    console.error('Failed to set WAL mode:', e);
  }
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      endTime TEXT,
      description TEXT,
      reminder INTEGER DEFAULT 0,
      notificationId TEXT
    );
    
    -- Attempt to add column if it doesn't exist (SQLite doesn't have IF NOT EXISTS for ADD COLUMN)
    -- We catch the error if it already exists
    PRAGMA table_info(appointments);
    
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT
    );
    
    CREATE TABLE IF NOT EXISTS appointment_people (
      appointment_id INTEGER,
      person_id INTEGER,
      FOREIGN KEY(appointment_id) REFERENCES appointments(id),
      FOREIGN KEY(person_id) REFERENCES people(id),
      PRIMARY KEY (appointment_id, person_id)
    );
  `);

  // Migration: Add reminder column if it doesn't exist
  try {
    await db.execAsync('ALTER TABLE appointments ADD COLUMN reminder INTEGER DEFAULT 0;');
  } catch (e) {}
  try {
    await db.execAsync('ALTER TABLE appointments ADD COLUMN notificationId TEXT;');
  } catch (e) {}
};
