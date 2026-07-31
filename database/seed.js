const { initDb, get, run } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  await initDb();
  console.log('Database schema initialized.');

  // Check if admin user exists
  const existingUser = await get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [
      'admin',
      hashedPassword,
      'falsariojericho@gmail.com'
    ]);
    console.log('Default admin user created (Username: admin, Password: admin123)');
  } else {
    console.log('Admin user already exists.');
  }

  // Seed default settings if empty
  const settingsCount = await get('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.count === 0) {
    const defaultSettings = [
      ['name', 'Jericho Falsario'],
      ['title', 'Information Technology Engineer'],
      ['hero_headline', 'I build secure, scalable systems & seamless user experiences.'],
      ['hero_subtitle', 'Full-stack engineer | Cloud & DevOps | Cybersecurity fundamentals — I turn complex problems into reliable products.'],
      ['email', 'falsariojericho@gmail.com'],
      ['linkedin', 'https://ph.linkedin.com/in/jerichofalsari0'],
      ['github', 'https://github.com/Morningstar112601/white-nissan-xtrail'],
      ['resume_filename', 'Jericho_Falsario_Resume.pdf'],
      ['badge_1', '5+ Years Experience'],
      ['badge_2', 'Google Cloud Certified'],
      ['badge_3', 'Top 10% Hackathon Winner']
    ];

    for (const [key, value] of defaultSettings) {
      await run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
    console.log('Default settings seeded.');
  }

  // Seed default skills if empty
  const skillsCount = await get('SELECT COUNT(*) as count FROM skills');
  if (skillsCount.count === 0) {
    const defaultSkills = [
      ['Systems & Tools', 'SAP, LMS, SME, OA, SharePoint, Lotus Notes, WordPress, Shopify', 90, 1],
      ['Programming & Web', 'HTML, CSS, JavaScript, PHP, C#, MERN', 85, 2],
      ['Software & Productivity', 'Microsoft Office/365, Canva, Adobe Tools', 80, 3],
      ['Networking & Hardware', 'LAN setup, cabling, printer & hardware troubleshooting', 78, 4],
      ['Database & Analytics', 'SQL, data reporting, system integrity checks', 78, 5],
      ['System Administration', 'Administered systems such as SAP, LMS, SME, WPH Web Applications, Lotus Notes', 78, 6]
    ];

    for (const [category, name, percentage, display_order] of defaultSkills) {
      await run('INSERT INTO skills (category, name, percentage, display_order) VALUES (?, ?, ?, ?)', [
        category, name, percentage, display_order
      ]);
    }
    console.log('Default skills seeded.');
  }

  // Seed default projects if empty
  const projectsCount = await get('SELECT COUNT(*) as count FROM projects');
  if (projectsCount.count === 0) {
    const defaultProjects = [
      {
        title: 'Real-time Monitoring Platform',
        description: 'Scalable telemetry pipeline with Prometheus & Pub/Sub, alerting & dashboards.',
        detailed_desc: 'Implemented ingestion autoscaling and cut mean time to detection by 60%. Designed low-latency real-time data visualizers and threshold alerting systems.',
        image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop',
        tags: 'GCP,Prometheus,Grafana',
        live_url: '#',
        github_url: '#',
        is_featured: 1,
        display_order: 1
      },
      {
        title: 'Secure File Transfer Service',
        description: 'End-to-end encrypted transfer with audit logs & RBAC for enterprise clients.',
        detailed_desc: 'Designed HSM-based key rotation and compliance logging to meet SOC2 requirements. Implemented secure chunked streaming and granular user access policies.',
        image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop',
        tags: 'Security,Go,OAuth2',
        live_url: '#',
        github_url: '#',
        is_featured: 1,
        display_order: 2
      },
      {
        title: 'Automation Toolkit',
        description: 'CLI and IaC templates for rapid environment provisioning and CI/CD pipelines.',
        detailed_desc: 'Reduced provisioning times from days to minutes while enforcing security baselines across hybrid-cloud infrastructures.',
        image_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop',
        tags: 'Terraform,CI/CD,Automation',
        live_url: '#',
        github_url: '#',
        is_featured: 1,
        display_order: 3
      }
    ];

    for (const p of defaultProjects) {
      await run(
        'INSERT INTO projects (title, description, detailed_desc, image_url, tags, live_url, github_url, is_featured, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.title, p.description, p.detailed_desc, p.image_url, p.tags, p.live_url, p.github_url, p.is_featured, p.display_order]
      );
    }
    console.log('Default projects seeded.');
  }

  // Seed default experiences if empty
  const expCount = await get('SELECT COUNT(*) as count FROM experiences');
  if (expCount.count === 0) {
    const defaultExp = [
      {
        type: 'work',
        title: 'System Administrator / IT Specialist',
        organization: 'Enterprise Solutions Corp',
        location: 'Manila, Philippines',
        start_date: '2021-01',
        end_date: 'Present',
        description: 'Managed & maintained enterprise systems (SAP, LMS, SME, Lotus Notes, WPH Web Applications). Overseeing system integrity, LAN cabling, database reporting, and tier-3 support.',
        display_order: 1
      },
      {
        type: 'work',
        title: 'Full-Stack Developer & Support Engineer',
        organization: 'Tech Innovations Inc',
        location: 'Remote',
        start_date: '2019-03',
        end_date: '2020-12',
        description: 'Built custom Web Applications (PHP, MERN, C#), optimized SQL queries, and automated administrative operations across department workflows.',
        display_order: 2
      },
      {
        type: 'education',
        title: 'Bachelor of Science in Information Technology',
        organization: 'State University of Information Technology',
        location: 'Philippines',
        start_date: '2015-06',
        end_date: '2019-04',
        description: 'Specialized in Software Engineering, Network Administration, and Database Systems.',
        display_order: 3
      }
    ];

    for (const e of defaultExp) {
      await run(
        'INSERT INTO experiences (type, title, organization, location, start_date, end_date, description, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [e.type, e.title, e.organization, e.location, e.start_date, e.end_date, e.description, e.display_order]
      );
    }
    console.log('Default experiences seeded.');
  }

  console.log('Database seeding complete!');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = seed;
