const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Department = require('./models/Department');
const Complaint = require('./models/Complaint');
const SupportTicket = require('./models/SupportTicket');
const AuditLog = require('./models/AuditLog');

const DEPARTMENTS = [
  { name: 'Roads & Infrastructure', description: 'Manages roads, bridges, footpaths and public infrastructure' },
  { name: 'Water & Sanitation',     description: 'Manages water supply, drainage and sanitation' },
  { name: 'Electricity',            description: 'Manages street lights, electrical faults and power supply' },
  { name: 'Waste Management',       description: 'Manages garbage collection, waste disposal and recycling' },
  { name: 'Parks & Public Spaces',  description: 'Manages parks, playgrounds and public spaces' },
];

const CITIES_DATA = {
  Mumbai:     { state: 'Maharashtra', lat: 19.0760, lng: 72.8777, wards: ['Ward A', 'Ward B', 'Ward C'], localities: ['Colaba', 'Andheri', 'Bandra'] },
  Delhi:      { state: 'Delhi',       lat: 28.7041, lng: 77.1025, wards: ['North Delhi', 'South Delhi'], localities: ['Connaught Place', 'Saket', 'Rohini'] },
  Pune:       { state: 'Maharashtra', lat: 18.5204, lng: 73.8567, wards: ['Kothrud', 'Baner'], localities: ['Kothrud', 'Aundh', 'Pimpri'] },
  Chennai:    { state: 'Tamil Nadu',  lat: 13.0827, lng: 80.2707, wards: ['Adyar', 'T. Nagar'], localities: ['Adyar', 'Mylapore', 'Velachery'] },
  Bengaluru:  { state: 'Karnataka',   lat: 12.9716, lng: 77.5946, wards: ['Ward 1', 'Ward 2', 'Ward 3'], localities: ['Koramangala', 'Indiranagar', 'HSR Layout'] },
};

const COMPLAINT_TITLES = [
  'Pothole on main road', 'Broken street light', 'No water supply since morning', 'Garbage overflow in park',
  'Illegal parking blocking gate', 'Open manhole on sidewalk', 'Frequent power cuts', 'Stray dog menace',
  'Broken park bench', 'Drainage leakage in basement', 'Illegal construction on public land', 'Noise pollution at night',
];

const BEFORE_IMG = 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800';
const AFTER_IMG  = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      Complaint.deleteMany({}),
      User.deleteMany({}),
      Department.deleteMany({}),
      SupportTicket.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('Cleared database');

    // 1. Core Admins
    const superAdmin = await User.create({
      name: 'Super Admin', email: 'superadmin@civicconnect.com',
      phone: '9000000000', password: 'Admin@123', role: 'superAdmin',
    });

    // Regional Admins
    for (const [cityName, info] of Object.entries(CITIES_DATA)) {
      const citySlug = cityName.toLowerCase();
      // State Admin (one per state)
      const existingStateAdmin = await User.findOne({ 'jurisdiction.state': info.state, role: 'stateAdmin' });
      if (!existingStateAdmin) {
        await User.create({
          name: `${info.state} State Admin`, email: `stateadmin.${info.state.toLowerCase().replace(/ /g, '')}@civicconnect.com`,
          phone: `91000${Math.floor(Math.random()*9999)}`, password: 'Admin@123',
          role: 'stateAdmin', jurisdiction: { country: 'India', state: info.state }
        });
      }

      // City Admin
      await User.create({
        name: `${cityName} City Admin`, email: `cityadmin.${citySlug}@civicconnect.com`,
        phone: `92000${Math.floor(Math.random()*9999)}`, password: 'Admin@123',
        role: 'cityAdmin', jurisdiction: { country: 'India', state: info.state, city: cityName }
      });
    }

    // 2. Departments & Officers
    const depts = [];
    for (const d of DEPARTMENTS) {
      const dept = await Department.create(d);
      depts.push(dept);
      // Create one officer per department for the demo
      const officer = await User.create({
        name: `${d.name} Officer`, email: `officer.${d.name.split(' ')[0].toLowerCase()}@civicconnect.com`,
        phone: `93000${Math.floor(Math.random()*9999)}`, password: 'Officer@123',
        role: 'officer', department: dept._id
      });
      dept.officers = [officer._id];
      await dept.save();
    }

    // 3. Citizens
    const citizens = [];
    for (let i = 1; i <= 20; i++) {
      const citizen = await User.create({
        name: `Citizen ${i}`, email: `citizen${i}@example.com`,
        phone: `99000${1000 + i}`, password: 'Citizen@123', role: 'citizen',
        trustScore: Math.floor(Math.random() * 41) + 60 // 60-100
      });
      citizens.push(citizen);
    }
    const testCitizen = await User.create({
      name: 'Test Citizen', email: 'citizen@civicconnect.com',
      phone: '9111111111', password: 'Test@123', role: 'citizen', status: 'active', trustScore: 100,
    });
    citizens.push(testCitizen);

    // 4. Generate 100+ Complaints
    console.log('Generating 110 complaints...');
    const complaints = [];
    for (let i = 0; i < 110; i++) {
      const cityNames = Object.keys(CITIES_DATA);
      const cityName  = cityNames[i % cityNames.length];
      const cityInfo  = CITIES_DATA[cityName];
      const dept      = depts[i % depts.length];
      const citizen   = citizens[i % citizens.length];
      const status    = ['Submitted', 'Assigned', 'InProgress', 'Resolved'][Math.floor(Math.random() * 4)];
      
      // Random offset for coordinates within the city
      const latOffset = (Math.random() - 0.5) * 0.1;
      const lngOffset = (Math.random() - 0.5) * 0.1;

      complaints.push({
        title: COMPLAINT_TITLES[Math.floor(Math.random() * COMPLAINT_TITLES.length)],
        description: 'Realistic civic issue description for testing regional data dashboards and geographic statistics.',
        category: dept.name,
        beforeImage: BEFORE_IMG,
        afterImage: status === 'Resolved' ? AFTER_IMG : undefined,
        location: { type: 'Point', coordinates: [cityInfo.lng + lngOffset, cityInfo.lat + latOffset] },
        locationDetails: {
          country: 'India', state: cityInfo.state, city: cityName,
          ward: cityInfo.wards[i % cityInfo.wards.length],
          locality: cityInfo.localities[i % cityInfo.localities.length],
        },
        status,
        citizen: citizen._id,
        department: dept._id,
        fundsSpent: status === 'Resolved' ? Math.floor(Math.random() * 50000) + 5000 : 0,
        upvotes: Math.floor(Math.random() * 50),
      });
    }
    await Complaint.insertMany(complaints);

    // 5. Audit Logs & Support
    await AuditLog.create({ action: 'DATABASE_SEED', performer: superAdmin._id, details: 'Generated 110 regional complaints' });
    
    console.log('\n========================================');
    console.log('  SEED COMPLETE: 110 complaints created');
    console.log('========================================');
    console.log('  Login Mumbai Admin: cityadmin.mumbai@civicconnect.com / Admin@123');
    console.log('  Login Delhi Admin:  cityadmin.delhi@civicconnect.com  / Admin@123');
    console.log('  Test Citizen:       citizen@civicconnect.com          / Test@123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
