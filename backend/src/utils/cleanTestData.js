require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Adoption = require('../models/Adoption');

async function cleanTestData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🧹 Limpiando datos de prueba...');
        
        await User.deleteMany({ email: /test\.com$/i });
        await Pet.deleteMany({ name: /test/i });
        await Adoption.deleteMany({});
        
        console.log('✅ Datos limpiados');
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

cleanTestData();