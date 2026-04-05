const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Department = require('./models/Department');
const Complaint = require('./models/Complaint');

const DEPARTMENTS = [
  { name: 'Roads & Infrastructure', description: 'Manages roads, bridges, footpaths and public infrastructure' },
  { name: 'Water & Sanitation',     description: 'Manages water supply, drainage and sanitation' },
  { name: 'Electricity',            description: 'Manages street lights, electrical faults and power supply' },
  { name: 'Waste Management',       description: 'Manages garbage collection, waste disposal and recycling' },
  { name: 'Parks & Public Spaces',  description: 'Manages parks, playgrounds and public spaces' },
];

const DEPT_ADMINS = [
  { name: 'Rajesh Kumar', phone: '9810001001', locality: 'Indiranagar, Bengaluru' },
  { name: 'Priya Sharma', phone: '9810001002', locality: 'Jayanagar, Bengaluru' },
  { name: 'Anil Verma',   phone: '9810001003', locality: 'Whitefield, Bengaluru' },
  { name: 'Sunita Reddy', phone: '9810001004', locality: 'Hebbal, Bengaluru' },
  { name: 'Mohan Das',    phone: '9810001005', locality: 'JP Nagar, Bengaluru' },
];

const DEPT_OFFICERS = [
  [
    { name: 'Arjun Nair',     phone: '9820002001', locality: 'Koramangala, Bengaluru' },
    { name: 'Deepak Singh',   phone: '9820002002', locality: 'HSR Layout, Bengaluru' },
    { name: 'Kiran Patel',    phone: '9820002003', locality: 'Bellandur, Bengaluru' },
  ],
  [
    { name: 'Farid Khan',     phone: '9820002004', locality: 'Shivajinagar, Bengaluru' },
    { name: 'Lakshmi Iyer',   phone: '9820002005', locality: 'Rajajinagar, Bengaluru' },
    { name: 'Sanjay Mehta',   phone: '9820002006', locality: 'Yeshwanthpur, Bengaluru' },
  ],
  [
    { name: 'Pooja Nandal',   phone: '9820002007', locality: 'Electronic City, Bengaluru' },
    { name: 'Ravi Shankar',   phone: '9820002008', locality: 'Bommanahalli, Bengaluru' },
    { name: 'Tejas Kulkarni', phone: '9820002009', locality: 'BTM Layout, Bengaluru' },
  ],
  [
    { name: 'Anita Desai',    phone: '9820002010', locality: 'Marathahalli, Bengaluru' },
    { name: 'Suresh Babu',    phone: '9820002011', locality: 'Sarjapur Road, Bengaluru' },
    { name: 'Nisha Thomas',   phone: '9820002012', locality: 'Bannerghatta Road, Bengaluru' },
  ],
  [
    { name: 'Vinod Gupta',    phone: '9820002013', locality: 'Yelahanka, Bengaluru' },
    { name: 'Meera Joshi',    phone: '9820002014', locality: 'Hebbal, Bengaluru' },
    { name: 'Prakash Rao',    phone: '9820002015', locality: 'Devanahalli, Bengaluru' },
  ],
];

const CITIZENS = [
  { name: 'Amit Sharma',   email: 'amit.sharma@gmail.com',   phone: '9900001001', locality: 'Koramangala, Bengaluru',     trustScore: 95 },
  { name: 'Neha Gupta',    email: 'neha.gupta@gmail.com',    phone: '9900001002', locality: 'Indiranagar, Bengaluru',     trustScore: 88 },
  { name: 'Rahul Verma',   email: 'rahul.verma@gmail.com',   phone: '9900001003', locality: 'HSR Layout, Bengaluru',      trustScore: 100 },
  { name: 'Divya Pillai',  email: 'divya.pillai@gmail.com',  phone: '9900001004', locality: 'Jayanagar, Bengaluru',       trustScore: 72 },
  { name: 'Karthik Menon', email: 'karthik.menon@gmail.com', phone: '9900001005', locality: 'Whitefield, Bengaluru',      trustScore: 100 },
  { name: 'Sneha Reddy',   email: 'sneha.reddy@gmail.com',   phone: '9900001006', locality: 'Electronic City, Bengaluru', trustScore: 90 },
  { name: 'Vishal Singh',  email: 'vishal.singh@gmail.com',  phone: '9900001007', locality: 'BTM Layout, Bengaluru',      trustScore: 60, strikeCount: 2, status: 'warned' },
  { name: 'Anjali Nair',   email: 'anjali.nair@gmail.com',   phone: '9900001008', locality: 'Marathahalli, Bengaluru',    trustScore: 100 },
  { name: 'Rohit Patel',   email: 'rohit.patel@gmail.com',   phone: '9900001009', locality: 'Sarjapur Road, Bengaluru',   trustScore: 85 },
  { name: 'Prachi Desai',  email: 'prachi.desai@gmail.com',  phone: '9900001010', locality: 'Yelahanka, Bengaluru',       trustScore: 100 },
];

// A placeholder image URL from Unsplash (no auth needed)
const BEFORE_IMG = 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800';
const AFTER_IMG  = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Complaint.deleteMany({});
    await User.deleteMany({});
    await Department.deleteMany({});
    console.log('Cleared existing data');

    // ── Super Admin ────────────────────────────────────────────────────────
    const superAdmin = await User.create({
      name: 'Super Admin', email: 'superadmin@civicconnect.com',
      phone: '9000000000', password: 'Admin@123',
      role: 'superAdmin', locality: 'MG Road, Bengaluru',
      status: 'active', trustScore: 100,
    });
    console.log('✓ Super Admin:', superAdmin.email);

    // ── Test Citizen ───────────────────────────────────────────────────────
    const testCitizen = await User.create({
      name: 'Test Citizen', email: 'citizen@civicconnect.com',
      phone: '9111111111', password: 'Test@123',
      role: 'citizen', locality: 'Koramangala, Bengaluru',
      status: 'active', trustScore: 100,
    });
    console.log('✓ Test Citizen:', testCitizen.email);

    // ── Departments + Admins + Officers ────────────────────────────────────
    const deptMap     = {}; // name → dept document
    const officerMap  = {}; // deptName → [officer docs]

    for (let i = 0; i < DEPARTMENTS.length; i++) {
      const deptDef  = DEPARTMENTS[i];
      const adminDef = DEPT_ADMINS[i];
      const short    = deptDef.name.split(' ')[0].toLowerCase();

      const dept = await Department.create({
        name: deptDef.name, description: deptDef.description,
      });

      const deptAdmin = await User.create({
        name: adminDef.name, email: `admin.${short}@civicconnect.com`,
        phone: adminDef.phone, password: 'Admin@123',
        role: 'deptAdmin', department: dept._id,
        locality: adminDef.locality, status: 'active', trustScore: 100,
      });

      const officerIds = [];
      const officerDocs = [];
      for (let j = 0; j < DEPT_OFFICERS[i].length; j++) {
        const off = DEPT_OFFICERS[i][j];
        const officer = await User.create({
          name: off.name, email: `officer${j + 1}.${short}@civicconnect.com`,
          phone: off.phone, password: 'Officer@123',
          role: 'officer', department: dept._id,
          locality: off.locality, status: 'active', trustScore: 100,
        });
        officerIds.push(officer._id);
        officerDocs.push(officer);
      }

      dept.admin    = deptAdmin._id;
      dept.officers = officerIds;
      await dept.save();

      deptMap[deptDef.name]    = dept;
      officerMap[deptDef.name] = officerDocs;

      console.log(`✓ Dept: ${dept.name} | admin: ${deptAdmin.email} | ${officerIds.length} officers`);
    }

    // ── Sample Citizens ────────────────────────────────────────────────────
    const citizenDocs = [];
    for (const c of CITIZENS) {
      const doc = await User.create({
        name: c.name, email: c.email, phone: c.phone,
        password: 'Citizen@123', role: 'citizen',
        locality: c.locality, status: c.status || 'active',
        trustScore: c.trustScore, strikeCount: c.strikeCount || 0,
      });
      citizenDocs.push(doc);
    }
    console.log(`✓ ${citizenDocs.length} sample citizens created`);

    // ── Complaints ─────────────────────────────────────────────────────────
    // Helper: pick a random element
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    const roadsDept  = deptMap['Roads & Infrastructure'];
    const waterDept  = deptMap['Water & Sanitation'];
    const elecDept   = deptMap['Electricity'];
    const wasteDept  = deptMap['Waste Management'];
    const parksDept  = deptMap['Parks & Public Spaces'];

    const roadsOfficers = officerMap['Roads & Infrastructure'];
    const waterOfficers = officerMap['Water & Sanitation'];
    const elecOfficers  = officerMap['Electricity'];
    const wasteOfficers = officerMap['Waste Management'];
    const parksOfficers = officerMap['Parks & Public Spaces'];

    // 1. RESOLVED complaint — Roads
    const c1 = await Complaint.create({
      title: 'Large pothole on 80 Feet Road',
      description: 'There is a massive pothole near the bus stop on 80 Feet Road, Koramangala. It has been there for 3 weeks and causes accidents daily.',
      category: 'Roads & Infrastructure',
      beforeImage: BEFORE_IMG, afterImage: AFTER_IMG,
      location: { type: 'Point', coordinates: [77.6245, 12.9352] },
      status: 'Resolved',
      citizen: citizenDocs[0]._id,
      department: roadsDept._id,
      assignedTo: roadsOfficers[0]._id,
      fundsSpent: 45000,
    });
    console.log('✓ Complaint (Resolved):', c1.title);

    // 2. IN PROGRESS — Water
    const c2 = await Complaint.create({
      title: 'Water pipe burst near Jayanagar 4th Block',
      description: 'A water supply pipe has burst at the junction of 4th Main and 36th Cross, Jayanagar. Water has been flowing for 2 days causing road damage.',
      category: 'Water & Sanitation',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.5947, 12.9257] },
      status: 'InProgress',
      citizen: citizenDocs[1]._id,
      department: waterDept._id,
      assignedTo: waterOfficers[1]._id,
    });
    console.log('✓ Complaint (InProgress):', c2.title);

    // 3. ASSIGNED — Electricity
    const c3 = await Complaint.create({
      title: 'Street light not working for 2 weeks',
      description: 'The street light at the entrance of Prestige Shantiniketan, Whitefield is not working since the past 2 weeks. The area is completely dark at night.',
      category: 'Electricity',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.7480, 12.9698] },
      status: 'Assigned',
      citizen: citizenDocs[2]._id,
      department: elecDept._id,
      assignedTo: elecOfficers[0]._id,
    });
    console.log('✓ Complaint (Assigned):', c3.title);

    // 4. SUBMITTED — Waste
    const c4 = await Complaint.create({
      title: 'Garbage not collected for 5 days',
      description: 'Garbage has not been collected on our street (BTM Layout 2nd Stage, 15th Cross) for 5 days. The smell is unbearable and attracting stray dogs.',
      category: 'Waste Management',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.6101, 12.9161] },
      status: 'Submitted',
      citizen: citizenDocs[6]._id,
      department: wasteDept._id,
    });
    console.log('✓ Complaint (Submitted):', c4.title);

    // 5. SUBMITTED — Parks
    const c5 = await Complaint.create({
      title: 'Broken benches and lights in Cubbon Park',
      description: 'Multiple benches near the children play area in Cubbon Park are broken and dangerous. Also park lights near the entrance have not been working for 10 days.',
      category: 'Parks & Public Spaces',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.5946, 12.9763] },
      status: 'Submitted',
      citizen: citizenDocs[4]._id,
      department: parksDept._id,
    });
    console.log('✓ Complaint (Submitted):', c5.title);

    // 6. RESOLVED — Electricity
    const c6 = await Complaint.create({
      title: 'Power outage in entire block',
      description: 'Complete power failure in HSR Layout Sector 2 since yesterday evening. Transformer seems to have tripped. Families with medical equipment are at risk.',
      category: 'Electricity',
      beforeImage: BEFORE_IMG, afterImage: AFTER_IMG,
      location: { type: 'Point', coordinates: [77.6484, 12.9116] },
      status: 'Resolved',
      citizen: citizenDocs[3]._id,
      department: elecDept._id,
      assignedTo: elecOfficers[2]._id,
      fundsSpent: 12000,
    });
    console.log('✓ Complaint (Resolved):', c6.title);

    // 7. SUBMITTED — Roads
    const c7 = await Complaint.create({
      title: 'Footpath encroachment by vendors',
      description: 'The entire footpath on Commercial Street has been encroached by unauthorised vendors. Pedestrians are forced to walk on the busy main road.',
      category: 'Roads & Infrastructure',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.6062, 12.9830] },
      status: 'Submitted',
      citizen: citizenDocs[7]._id,
      department: roadsDept._id,
    });
    console.log('✓ Complaint (Submitted):', c7.title);

    // ── DUPLICATE complaints (same location, same issue, different wording) ──

    // 8. Original complaint — pothole at Sarjapur Road
    const c8 = await Complaint.create({
      title: 'Pothole on Sarjapur Road',
      description: 'Deep pothole near the Dominos Pizza outlet on Sarjapur Road. Very dangerous for two-wheelers.',
      category: 'Roads & Infrastructure',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.6784, 12.9120] },
      status: 'Submitted',
      citizen: citizenDocs[0]._id,
      department: roadsDept._id,
      upvotes: 3,
    });
    console.log('✓ Complaint (Original):', c8.title);

    // 9. DUPLICATE of c8 — same location, different words → marked Rejected/duplicate by ML
    const c9 = await Complaint.create({
      title: 'Big hole in the middle of the road near Sarjapur',
      description: 'There is a large pit on the main Sarjapur Road which is causing accidents. It is right in front of a fast food restaurant.',
      category: 'Roads & Infrastructure',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.6785, 12.9121] }, // ~10m away
      status: 'Rejected',
      rejectionReason: 'Duplicate complaint detected (84% match). Your upvote has been added to the existing complaint.',
      duplicateOf: c8._id,
      citizen: citizenDocs[8]._id,
      department: roadsDept._id,
    });
    // Add upvote to original
    await Complaint.findByIdAndUpdate(c8._id, { $inc: { upvotes: 1 } });
    console.log('✓ Complaint (Duplicate of c8):', c9.title);

    // 10. Another DUPLICATE of c8
    const c10 = await Complaint.create({
      title: 'Road damaged causing accidents on Sarjapur',
      description: 'The road near Sarjapur has a huge crater that has already caused two bike accidents this week.',
      category: 'Roads & Infrastructure',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.6786, 12.9119] }, // ~15m away
      status: 'Rejected',
      rejectionReason: 'Duplicate complaint detected (79% match). Your upvote has been added to the existing complaint.',
      duplicateOf: c8._id,
      citizen: citizenDocs[5]._id,
      department: roadsDept._id,
    });
    await Complaint.findByIdAndUpdate(c8._id, { $inc: { upvotes: 1 } });
    console.log('✓ Complaint (Duplicate of c8):', c10.title);

    // ── AI-GENERATED / REJECTED complaints ──────────────────────────────────

    // 11. Rejected — AI-generated image (Vishal Singh — already has strikes)
    const c11 = await Complaint.create({
      title: 'Broken road near Metro Station',
      description: 'The road right outside Baiyappanahalli Metro Station is completely broken with large potholes.',
      category: 'Roads & Infrastructure',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.6604, 12.9983] },
      status: 'Rejected',
      rejectionReason: 'AI-generated or digitally altered image detected. Strike 3 of 5 recorded.',
      citizen: citizenDocs[6]._id, // Vishal Singh (already warned)
      department: roadsDept._id,
    });
    // Update Vishal's strike count
    await User.findByIdAndUpdate(citizenDocs[6]._id, { $inc: { strikeCount: 1 }, status: 'warned' });
    console.log('✓ Complaint (AI-Rejected):', c11.title);

    // 12. Another AI-Rejected — different citizen
    const c12 = await Complaint.create({
      title: 'Flooded underpass near Silk Board',
      description: 'The underpass near Silk Board junction is completely flooded and vehicles are getting stuck. The water level is dangerously high.',
      category: 'Water & Sanitation',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.6233, 12.9175] },
      status: 'Rejected',
      rejectionReason: 'AI-generated or digitally altered image detected. Strike 1 of 5 recorded.',
      citizen: citizenDocs[3]._id, // Divya Pillai
      department: waterDept._id,
    });
    await User.findByIdAndUpdate(citizenDocs[3]._id, { $inc: { strikeCount: 1 } });
    console.log('✓ Complaint (AI-Rejected):', c12.title);

    // 13. InProgress — Water (test citizen)
    const c13 = await Complaint.create({
      title: 'Sewage overflow on 5th Cross',
      description: 'Sewage is overflowing onto the road on 5th Cross, Koramangala 1st Block. The entire street smells and is a health hazard.',
      category: 'Water & Sanitation',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.6184, 12.9350] },
      status: 'InProgress',
      citizen: testCitizen._id,
      department: waterDept._id,
      assignedTo: waterOfficers[0]._id,
    });
    console.log('✓ Complaint (InProgress):', c13.title);

    // 14. Submitted — Parks (test citizen)
    const c14 = await Complaint.create({
      title: 'Stray dogs attacking joggers in HSR park',
      description: 'A pack of stray dogs near the HSR Layout Sector 2 park has been attacking joggers every morning. Two people have been bitten this week.',
      category: 'Parks & Public Spaces',
      beforeImage: BEFORE_IMG,
      location: { type: 'Point', coordinates: [77.6484, 12.9120] },
      status: 'Submitted',
      citizen: testCitizen._id,
      department: parksDept._id,
    });
    console.log('✓ Complaint (Submitted):', c14.title);

    // ── Print Summary ──────────────────────────────────────────────────────
    const totalComplaints = await Complaint.countDocuments();
    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log(`Total complaints created: ${totalComplaints}`);
    console.log('========================================');
    console.log('\n📋 LOGIN CREDENTIALS\n');
    console.log('SUPER ADMIN');
    console.log('  superadmin@civicconnect.com  →  Admin@123\n');
    console.log('TEST CITIZEN');
    console.log('  citizen@civicconnect.com     →  Test@123\n');
    console.log('DEPT ADMINS  (password: Admin@123)');
    DEPARTMENTS.forEach(d => {
      const s = d.name.split(' ')[0].toLowerCase();
      console.log(`  admin.${s}@civicconnect.com`);
    });
    console.log('\nOFFICERS  (password: Officer@123)');
    DEPARTMENTS.forEach(d => {
      const s = d.name.split(' ')[0].toLowerCase();
      [1, 2, 3].forEach(n => console.log(`  officer${n}.${s}@civicconnect.com`));
    });
    console.log('\nSAMPLE CITIZENS  (password: Citizen@123)');
    CITIZENS.forEach(c => console.log(`  ${c.email}`));
    console.log('\n📊 COMPLAINT BREAKDOWN');
    console.log('  Resolved  : 2  (Roads, Electricity)');
    console.log('  InProgress: 2  (Water x2)');
    console.log('  Assigned  : 1  (Electricity)');
    console.log('  Submitted : 5  (Roads x2, Waste, Parks x2)');
    console.log('  Rejected  : 4  (2 AI-generated, 2 duplicates)');
    console.log('\n========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
