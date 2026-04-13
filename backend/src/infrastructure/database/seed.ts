import { pool } from './pool';
import bcrypt from 'bcryptjs';

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing data
    await client.query('TRUNCATE bids, tenders, categories, users RESTART IDENTITY CASCADE');

    // --- Users ---
    const hash = await bcrypt.hash('password123', 10);

    const { rows: users } = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, company_name, phone, avatar_url) VALUES
        ('admin@tender.com', $1, 'System Admin', 'ADMIN', NULL, NULL, NULL),
        ('org1@tender.com', $1, 'Ministry of Infrastructure', 'ORGANIZATION', 'Ministry of Infrastructure', '+251911100100', NULL),
        ('org2@tender.com', $1, 'City Health Department', 'ORGANIZATION', 'City Health Department', '+251911100101', NULL),
        ('org3@tender.com', $1, 'National Education Board', 'ORGANIZATION', 'National Education Board', '+251911100102', NULL),
        ('bidder@tender.com', $1, 'John Contractor', 'BIDDER', 'BuildRight Ltd', '+251911200200', 'https://i.pravatar.cc/200?img=12'),
        ('bidder2@tender.com', $1, 'Sarah Engineer', 'BIDDER', 'TechSolutions Inc', '+251911200201', 'https://i.pravatar.cc/200?img=5')
       RETURNING id, role, company_name`,
      [hash]
    );

    const org1 = users.find((u) => u.company_name === 'Ministry of Infrastructure')!.id;
    const org2 = users.find((u) => u.company_name === 'City Health Department')!.id;
    const org3 = users.find((u) => u.company_name === 'National Education Board')!.id;

    // --- Categories ---
    const { rows: cats } = await client.query(
      `INSERT INTO categories (name, slug, description) VALUES
        ('Construction', 'construction', 'Building, roads, and infrastructure projects'),
        ('IT & Software', 'it-software', 'Software development, IT services, and digital solutions'),
        ('Healthcare', 'healthcare', 'Medical equipment, supplies, and health services'),
        ('Education', 'education', 'Educational materials, training, and school supplies'),
        ('Consulting', 'consulting', 'Professional advisory and consulting services'),
        ('Supplies & Equipment', 'supplies', 'Office supplies, furniture, and general equipment'),
        ('Logistics', 'logistics', 'Transportation, warehousing, and supply chain services')
       RETURNING id, slug`
    );

    const catMap = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

    // --- Tenders ---
    const now = new Date();
    const future = (days: number) => new Date(now.getTime() + days * 86400000).toISOString();
    const past = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

    // Batch 1: Construction & IT tenders
    await client.query(
      `INSERT INTO tenders (title, description, reference_number, category_id, organization_id, budget_min, budget_max, deadline, status, location, requirements) VALUES
        ('Highway Bridge Construction - Phase 2',
         'Construction of a 500-meter reinforced concrete bridge over the river connecting the northern and southern districts. Includes foundation work, pillars, deck construction, and safety barriers.',
         'TND-2026-001', $1, $2, 2500000, 3500000, $3, 'OPEN', 'Northern District',
         'Minimum 10 years experience in bridge construction. ISO 9001 certified. Must provide safety compliance documentation.'),

        ('Hospital Management System Development',
         'Development of a comprehensive hospital management system including patient records, appointment scheduling, billing, pharmacy management, and reporting modules. Must integrate with existing laboratory systems.',
         'TND-2026-002', $4, $5, 150000, 250000, $6, 'OPEN', 'Remote / On-site hybrid',
         'Experience with healthcare systems. HIPAA compliance knowledge required. Tech stack: preferably Node.js/React or .NET.'),

        ('Supply of Medical Equipment for ICU Units',
         'Procurement of ventilators, patient monitors, infusion pumps, and defibrillators for 5 new ICU units. Equipment must meet international medical standards.',
         'TND-2026-003', $7, $5, 800000, 1200000, $8, 'OPEN', 'Central Hospital',
         'CE/FDA certified equipment only. 2-year warranty minimum. Training for staff included.'),

        ('School Furniture Supply - 20 Schools',
         'Supply and delivery of desks, chairs, whiteboards, and storage cabinets for 20 primary schools. Approximately 5000 desk-chair sets required.',
         'TND-2026-004', $9, $10, 180000, 280000, $11, 'OPEN', 'Multiple locations',
         'Ergonomic design for children ages 6-12. Durable materials with 5-year warranty.'),

        ('Digital Transformation Consulting',
         'Strategic consulting for digital transformation roadmap including process automation, cloud migration strategy, and change management for government departments.',
         'TND-2026-005', $12, $2, 80000, 150000, $13, 'OPEN', 'Capital City',
         'Proven track record with government clients. Team must include certified cloud architects.'),

        ('Road Resurfacing - Main Avenue',
         'Asphalt resurfacing of 12km main avenue including drainage improvements, road markings, and traffic signal upgrades.',
         'TND-2026-006', $1, $2, 600000, 850000, $14, 'OPEN', 'Main Avenue, Downtown',
         'Must complete within 90 days. Night work capability required to minimize traffic disruption.')`,
      [
        catMap['construction'], org1, future(30),
        catMap['it-software'], org2, future(25),
        catMap['healthcare'], future(20),
        catMap['supplies'], org3, future(15),
        catMap['consulting'], future(35),
        future(40),
      ]
    );

    // Batch 2: Education, Supplies, IT, Healthcare tenders
    await client.query(
      `INSERT INTO tenders (title, description, reference_number, category_id, organization_id, budget_min, budget_max, deadline, status, location, requirements) VALUES
        ('E-Learning Platform Development',
         'Build a scalable e-learning platform supporting video lectures, quizzes, assignments, and live virtual classrooms for 50,000+ students.',
         'TND-2026-007', $1, $2, 200000, 350000, $3, 'OPEN', 'Remote',
         'Experience with video streaming. Mobile-responsive design. Must support offline content access.'),

        ('Office Supplies Annual Contract',
         'Annual supply contract for stationery, printing paper, toners, and general office consumables for 15 government offices.',
         'TND-2026-008', $4, $5, 50000, 90000, $6, 'OPEN', 'Multiple offices',
         'Monthly delivery schedule. Online ordering portal preferred.'),

        ('Water Treatment Plant Upgrade',
         'Upgrade of existing water treatment facility including new filtration systems, pumping stations, and SCADA control systems.',
         'TND-2025-045', $7, $5, 1800000, 2400000, $8, 'CLOSED', 'Eastern District',
         'Environmental compliance certification required.'),

        ('Cybersecurity Audit Services',
         'Comprehensive security audit of government IT infrastructure including penetration testing, vulnerability assessment, and compliance review.',
         'TND-2026-009', $9, $5, 40000, 70000, $10, 'OPEN', 'On-site',
         'Certified ethical hackers (CEH/OSCP). NDA required. Government security clearance preferred.'),

        ('Ambulance Fleet Procurement',
         'Purchase of 10 fully equipped Type III ambulances with advanced life support equipment.',
         'TND-2026-010', $11, $12, 1500000, 2000000, $13, 'OPEN', 'City Health Department HQ',
         'Vehicles must be new (current year model). Include 3-year maintenance package.'),

        ('Teacher Training Program',
         'Design and delivery of professional development program for 500 teachers covering modern pedagogy, digital tools, and inclusive education.',
         'TND-2026-011', $14, $2, 60000, 100000, $15, 'OPEN', 'Regional Training Centers',
         'Trainers must have education background. Bilingual delivery (English + local language).')`,
      [
        catMap['it-software'], org3, future(28),
        catMap['supplies'], org1, future(12),
        catMap['construction'], past(10),
        catMap['it-software'], future(18),
        catMap['healthcare'], org2, future(45),
        catMap['education'], future(22),
      ]
    );

    // Batch 3: Logistics tenders
    await client.query(
      `INSERT INTO tenders (title, description, reference_number, category_id, organization_id, budget_min, budget_max, deadline, status, location, requirements) VALUES
        ('National Freight Transport Services',
         'Long-term contract for transporting government supplies across 8 regional warehouses. Includes scheduling, tracking, and last-mile delivery to remote facilities.',
         'TND-2026-012', $1, $2, 300000, 500000, $3, 'OPEN', 'Nationwide',
         'Fleet of minimum 50 trucks. GPS tracking on all vehicles. ISO 28000 supply chain security certification preferred.'),

        ('Warehouse Management System Implementation',
         'Design and deployment of a centralized warehouse management system (WMS) to track inventory across 12 government storage facilities in real time.',
         'TND-2026-013', $1, $4, 120000, 200000, $5, 'OPEN', 'Capital City / Remote',
         'Experience with WMS platforms (SAP, Oracle, or custom). Barcode and RFID integration required. Training for 60 staff members.'),

        ('Cold Chain Logistics for Vaccine Distribution',
         'Temperature-controlled transport and storage of vaccines from central depot to 200 regional health centers. Strict compliance with WHO cold chain guidelines.',
         'TND-2026-014', $1, $6, 400000, 650000, $7, 'OPEN', 'Nationwide',
         'Refrigerated fleet with real-time temperature monitoring. Experience in pharmaceutical logistics. 24/7 operations capability.')`,
      [
        catMap['logistics'], org1, future(32),
        org1, future(20),
        org2, future(26),
      ]
    );

    // Batch 4: Additional Construction tenders
    await client.query(
      `INSERT INTO tenders (title, description, reference_number, category_id, organization_id, budget_min, budget_max, deadline, status, location, requirements) VALUES
        ('Government Office Complex Renovation',
         'Complete renovation of a 5-story government office building including structural reinforcement, electrical rewiring, HVAC system upgrade, and modern interior finishing.',
         'TND-2026-015', $1, $2, 1200000, 1800000, $3, 'OPEN', 'Central Business District',
         'Class A contractor license. Experience with occupied-building renovations. Green building certification knowledge preferred.'),

        ('Rural School Construction - 5 Sites',
         'Construction of 5 new primary school buildings in rural areas. Each site includes 8 classrooms, administrative offices, sanitary facilities, and a playground.',
         'TND-2026-016', $1, $4, 2000000, 3000000, $5, 'OPEN', 'Rural Districts',
         'Experience in rural construction projects. Must source local labor where possible. Solar power integration required.')`,
      [
        catMap['construction'], org1, future(50),
        org3, future(60),
      ]
    );

    // Batch 5: Additional IT Services tenders
    await client.query(
      `INSERT INTO tenders (title, description, reference_number, category_id, organization_id, budget_min, budget_max, deadline, status, location, requirements) VALUES
        ('Cloud Infrastructure Migration',
         'Migration of 30+ legacy on-premise applications to a cloud environment. Includes architecture assessment, containerization strategy, data migration, and post-migration support.',
         'TND-2026-017', $1, $2, 250000, 400000, $3, 'OPEN', 'Remote / On-site hybrid',
         'AWS or Azure certified architects. Experience migrating government workloads. Zero-downtime migration strategy required.'),

        ('Public Services Mobile App Development',
         'Development of a citizen-facing mobile application for Android and iOS enabling online permit applications, bill payments, complaint tracking, and appointment scheduling.',
         'TND-2026-018', $1, $2, 100000, 180000, $4, 'OPEN', 'Remote',
         'Cross-platform development (React Native or Flutter). Accessibility compliance (WCAG 2.1). Integration with national ID system.')`,
      [
        catMap['it-software'], org1, future(35),
        future(42),
      ]
    );

    // Batch 6: Additional Consulting tenders
    await client.query(
      `INSERT INTO tenders (title, description, reference_number, category_id, organization_id, budget_min, budget_max, deadline, status, location, requirements) VALUES
        ('Financial Management Advisory Services',
         'Advisory engagement to review and optimize public financial management processes including budgeting, procurement workflows, audit compliance, and revenue collection.',
         'TND-2026-019', $1, $2, 90000, 160000, $3, 'OPEN', 'Capital City',
         'CPA or ACCA qualified team lead. Experience with public sector financial reform. Knowledge of IFRS and IPSAS standards.'),

        ('Environmental Impact Assessment - Industrial Zone',
         'Comprehensive environmental and social impact assessment for a proposed 500-hectare industrial development zone, including public consultation and mitigation strategy.',
         'TND-2026-020', $1, $2, 70000, 120000, $4, 'OPEN', 'Eastern Province',
         'Registered environmental consultancy. Lead assessor with 10+ years experience. GIS mapping capability required.'),

        ('Human Resources Strategy Consulting',
         'Develop a 5-year HR modernization strategy for civil service reform covering talent acquisition, performance management, digital HR systems, and workforce planning.',
         'TND-2026-021', $1, $5, 55000, 95000, $6, 'AWARDED', 'Capital City',
         'Senior HR consultants with public sector experience. Change management certification. Familiarity with competency-based frameworks.')`,
      [
        catMap['consulting'], org1, future(38),
        future(44),
        org3, past(5),
      ]
    );

    await client.query('COMMIT');
    console.log('✓ Database seeded successfully');
    console.log('');
    console.log('Test accounts (password: password123):');
    console.log('  Admin:        admin@tender.com');
    console.log('  Organization: org1@tender.com');
    console.log('  Bidder:       bidder@tender.com');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
