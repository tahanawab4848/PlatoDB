import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.resolve('server/data.json');

const defaultData = {
  users: [
    { id: "u1", name: "Architect", email: "admin@flowforge.com" }
  ],
  projects: [
    { 
      id: "p1", 
      userId: "u1", 
      name: "E-Commerce Backend", 
      updatedAt: new Date().toISOString(), 
      tables: [], 
      relations: [],
      history: [] // store snapshots
    }
  ]
};

export async function initDb() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(defaultData, null, 2));
  }
}

export async function readDb() {
  const data = await fs.readFile(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

export async function writeDb(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// User methods
export async function getUsers() {
  const db = await readDb();
  return db.users;
}

export async function createUser(name, email, password) {
  const db = await readDb();
  if (db.users.find(u => u.email === email)) {
    throw new Error("Email already exists");
  }
  const newUser = {
    id: 'u_' + Date.now(),
    name,
    email,
    password // MVP: storing as plain text in local json
  };
  db.users.push(newUser);
  await writeDb(db);
  const { password: _, ...userWithoutPass } = newUser;
  return userWithoutPass;
}

export async function authenticateUser(email, password) {
  const db = await readDb();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error("Invalid email or password");
  const { password: _, ...userWithoutPass } = user;
  return userWithoutPass;
}

// Project methods
export async function getProjectsByUser(userId) {
  const db = await readDb();
  return db.projects.filter(p => p.userId === userId);
}

export async function createProject(userId, name) {
  const db = await readDb();
  const newProject = {
    id: 'proj_' + Date.now(),
    userId,
    name,
    updatedAt: new Date().toISOString(),
    tables: [],
    relations: [],
    history: []
  };
  db.projects.push(newProject);
  await writeDb(db);
  return newProject;
}

export async function updateProjectSchema(projectId, tables, relations, snapshotMessage) {
  const db = await readDb();
  const project = db.projects.find(p => p.id === projectId);
  if (!project) throw new Error("Project not found");

  project.tables = tables;
  project.relations = relations;
  project.updatedAt = new Date().toISOString();

  if (snapshotMessage) {
    project.history.push({
      id: 'snap_' + Date.now(),
      message: snapshotMessage,
      timestamp: project.updatedAt,
      tables: JSON.parse(JSON.stringify(tables)),
      relations: JSON.parse(JSON.stringify(relations))
    });
    // Keep only the most recent 10 snapshots
    if (project.history.length > 10) {
      project.history = project.history.slice(-10);
    }
  }

  await writeDb(db);
  return project;
}

export async function getProject(projectId) {
  const db = await readDb();
  return db.projects.find(p => p.id === projectId);
}
