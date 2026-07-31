const path = require('path');
const fs = require('fs');

const dataFilePath = path.join(__dirname, '..', 'portfolio_data.json');

// Default initial state
const initialState = {
  users: [],
  projects: [],
  skills: [],
  experiences: [],
  messages: [],
  settings: {}
};

function loadData() {
  if (!fs.existsSync(dataFilePath)) {
    saveData(initialState);
    return initialState;
  }
  try {
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading JSON DB, initializing new:', err);
    saveData(initialState);
    return initialState;
  }
}

function saveData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}

async function initDb() {
  if (!fs.existsSync(dataFilePath)) {
    saveData(initialState);
  }
}

// Emulate SQL-like helper methods for minimal code disruption
const get = async (sql, params = []) => {
  const data = loadData();
  
  if (sql.includes('FROM users WHERE username = ?')) {
    return data.users.find(u => u.username === params[0]);
  }
  if (sql.includes('FROM users WHERE id = ?')) {
    return data.users.find(u => u.id === params[0]);
  }
  if (sql.includes('SELECT COUNT(*) as count FROM settings')) {
    return { count: Object.keys(data.settings).length };
  }
  if (sql.includes('SELECT COUNT(*) as count FROM skills')) {
    return { count: data.skills.length };
  }
  if (sql.includes('SELECT COUNT(*) as count FROM projects')) {
    return { count: data.projects.length };
  }
  if (sql.includes('SELECT COUNT(*) as count FROM experiences')) {
    return { count: data.experiences.length };
  }
  if (sql.includes('FROM projects WHERE id = ?')) {
    return data.projects.find(p => p.id == params[0]);
  }
  if (sql.includes('FROM skills WHERE id = ?')) {
    return data.skills.find(s => s.id == params[0]);
  }
  if (sql.includes('FROM experiences WHERE id = ?')) {
    return data.experiences.find(e => e.id == params[0]);
  }
  return null;
};

const all = async (sql, params = []) => {
  const data = loadData();

  if (sql.includes('FROM projects')) {
    return [...data.projects].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }
  if (sql.includes('FROM skills')) {
    return [...data.skills].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }
  if (sql.includes('FROM experiences')) {
    return [...data.experiences].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }
  if (sql.includes('FROM messages')) {
    return [...data.messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  if (sql.includes('FROM settings')) {
    return Object.entries(data.settings).map(([key, value]) => ({ key, value }));
  }
  return [];
};

const run = async (sql, params = []) => {
  const data = loadData();

  if (sql.includes('INSERT INTO users')) {
    const newUser = {
      id: Date.now(),
      username: params[0],
      password: params[1],
      email: params[2],
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    saveData(data);
    return { lastID: newUser.id };
  }

  if (sql.includes('UPDATE users SET password = ? WHERE id = ?')) {
    const user = data.users.find(u => u.id == params[1]);
    if (user) {
      user.password = params[0];
      saveData(data);
    }
    return {};
  }

  if (sql.includes('INSERT INTO settings')) {
    data.settings[params[0]] = params[1];
    saveData(data);
    return {};
  }

  if (sql.includes('INSERT INTO skills')) {
    const newSkill = {
      id: Date.now(),
      category: params[0],
      name: params[1],
      percentage: params[2],
      display_order: params[3] || 0
    };
    data.skills.push(newSkill);
    saveData(data);
    return { lastID: newSkill.id };
  }

  if (sql.includes('UPDATE skills SET category = ?')) {
    const skill = data.skills.find(s => s.id == params[4]);
    if (skill) {
      skill.category = params[0];
      skill.name = params[1];
      skill.percentage = params[2];
      skill.display_order = params[3];
      saveData(data);
    }
    return {};
  }

  if (sql.includes('DELETE FROM skills WHERE id = ?')) {
    data.skills = data.skills.filter(s => s.id != params[0]);
    saveData(data);
    return {};
  }

  if (sql.includes('INSERT INTO projects')) {
    const newProject = {
      id: Date.now(),
      title: params[0],
      description: params[1],
      detailed_desc: params[2],
      image_url: params[3],
      tags: params[4],
      live_url: params[5],
      github_url: params[6],
      is_featured: params[7],
      display_order: params[8],
      created_at: new Date().toISOString()
    };
    data.projects.push(newProject);
    saveData(data);
    return { lastID: newProject.id };
  }

  if (sql.includes('UPDATE projects')) {
    const p = data.projects.find(proj => proj.id == params[9]);
    if (p) {
      p.title = params[0];
      p.description = params[1];
      p.detailed_desc = params[2];
      p.image_url = params[3];
      p.tags = params[4];
      p.live_url = params[5];
      p.github_url = params[6];
      p.is_featured = params[7];
      p.display_order = params[8];
      saveData(data);
    }
    return {};
  }

  if (sql.includes('DELETE FROM projects WHERE id = ?')) {
    data.projects = data.projects.filter(p => p.id != params[0]);
    saveData(data);
    return {};
  }

  if (sql.includes('INSERT INTO experiences')) {
    const newExp = {
      id: Date.now(),
      type: params[0],
      title: params[1],
      organization: params[2],
      location: params[3],
      start_date: params[4],
      end_date: params[5],
      description: params[6],
      display_order: params[7]
    };
    data.experiences.push(newExp);
    saveData(data);
    return { lastID: newExp.id };
  }

  if (sql.includes('UPDATE experiences SET type = ?')) {
    const exp = data.experiences.find(e => e.id == params[8]);
    if (exp) {
      exp.type = params[0];
      exp.title = params[1];
      exp.organization = params[2];
      exp.location = params[3];
      exp.start_date = params[4];
      exp.end_date = params[5];
      exp.description = params[6];
      exp.display_order = params[7];
      saveData(data);
    }
    return {};
  }

  if (sql.includes('DELETE FROM experiences WHERE id = ?')) {
    data.experiences = data.experiences.filter(e => e.id != params[0]);
    saveData(data);
    return {};
  }

  if (sql.includes('INSERT INTO messages')) {
    const newMsg = {
      id: Date.now(),
      sender_name: params[0],
      sender_email: params[1],
      subject: params[2],
      message: params[3],
      is_read: 0,
      created_at: new Date().toISOString()
    };
    data.messages.push(newMsg);
    saveData(data);
    return { lastID: newMsg.id };
  }

  if (sql.includes('UPDATE messages SET is_read = 1')) {
    const msg = data.messages.find(m => m.id == params[0]);
    if (msg) {
      msg.is_read = 1;
      saveData(data);
    }
    return {};
  }

  if (sql.includes('DELETE FROM messages WHERE id = ?')) {
    data.messages = data.messages.filter(m => m.id != params[0]);
    saveData(data);
    return {};
  }

  return {};
};

module.exports = {
  initDb,
  get,
  all,
  run
};
