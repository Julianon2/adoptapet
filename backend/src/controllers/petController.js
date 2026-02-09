const Pet = require('../models/Pet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// FUNCIONES BÁSICAS DEL CONTROLADOR
// ============================================

/**
 * Obtener todas las mascotas con filtros
 */
exports.getAllPets = async (req, res) => {
  try {
    const { species, gender, size, status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (species) filter.species = species.toLowerCase();
    if (gender) filter.gender = gender.toLowerCase();
    if (size) filter.size = size.toLowerCase();
    if (status) filter.status = status;

    const pets = await Pet.find(filter)
      .populate('owner', 'nombre name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Pet.countDocuments(filter);

    res.json({
      success: true,
      data: pets,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error al obtener mascotas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener mascotas'
    });
  }
};

/**
 * Buscar mascotas
 */
exports.searchPets = async (req, res) => {
  try {
    const { q } = req.query;
    
    const pets = await Pet.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { breed: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    })
    .populate('owner', 'nombre name email avatar')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pets
    });
  } catch (error) {
    console.error('Error al buscar mascotas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al buscar mascotas'
    });
  }
};

/**
 * Obtener mascota por ID
 */
exports.getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate('owner', 'nombre name email avatar');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada'
      });
    }

    res.json({
      success: true,
      data: pet
    });
  } catch (error) {
    console.error('Error al obtener mascota:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener mascota'
    });
  }
};

/**
 * Obtener mascotas por refugio
 */
exports.getPetsByShelterId = async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.params.shelterId })
      .populate('owner', 'nombre name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pets
    });
  } catch (error) {
    console.error('Error al obtener mascotas del refugio:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener mascotas'
    });
  }
};

/**
 * Crear mascota (solo para refugios/admins)
 */
exports.createPet = async (req, res) => {
  try {
    const petData = {
      ...req.body,
      owner: req.user.id,
      status: 'disponible'
    };

    const pet = await Pet.create(petData);

    res.status(201).json({
      success: true,
      data: pet,
      message: 'Mascota creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear mascota:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear mascota'
    });
  }
};

/**
 * Actualizar mascota
 */
exports.updatePet = async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada'
      });
    }

    res.json({
      success: true,
      data: pet,
      message: 'Mascota actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar mascota:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar mascota'
    });
  }
};

/**
 * Eliminar mascota
 */
exports.deletePet = async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Mascota eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar mascota:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar mascota'
    });
  }
};

// ============================================
// ADOPCIÓN - FUNCIONES PARA USUARIOS
// ============================================

// Crear directorio si no existe
const uploadsDir = path.join(__dirname, '../../uploads/pets');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/pets/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
}).array('imagenes', 5);

/**
 * Listar mascotas en adopción
 */
exports.getMascotasEnAdopcion = async (req, res) => {
  try {
    const pets = await Pet.find({ status: "disponible" })
      .sort({ createdAt: -1 })
      .populate("owner", "nombre name email avatar");

    console.log('✅ Mascotas en adopción encontradas:', pets.length);

    return res.json({ success: true, data: pets });
  } catch (error) {
    console.error('❌ Error al obtener mascotas:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al obtener mascotas en adopción",
    });
  }
};

/**
 * Publicar mascota en adopción (usuarios normales)
 */
exports.publicarMascotaAdopcion = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error('❌ Error al subir imágenes:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const {
        nombre, tipo, raza, edad, sexo, tamano,
        descripcion, vacunado, esterilizado,
        ubicacion, telefono
      } = req.body;

      console.log('📝 Datos recibidos:', { nombre, tipo, edad, archivos: req.files?.length });

      if (!nombre || !tipo || !edad) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, tipo y edad son obligatorios'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes subir al menos una foto de la mascota'
        });
      }

      const photos = req.files.map((file) => `/uploads/pets/${file.filename}`);
      const mainPhoto = photos[0];

      let ageValue = 0;
      let ageUnit = "años";

      if (typeof edad === "string") {
        const num = parseInt(edad, 10);
        if (!isNaN(num)) ageValue = num;
        if (edad.toLowerCase().includes("mes")) ageUnit = "meses";
      } else if (typeof edad === "number") {
        ageValue = edad;
      }

      let finalDescription = descripcion && descripcion.trim().length >= 20
        ? descripcion.trim()
        : `${nombre} busca un hogar amoroso. ${descripcion || 'Es una mascota maravillosa que merece una segunda oportunidad.'} Contáctanos para conocerle.`.trim();

      const nuevaMascota = await Pet.create({
        name: nombre,
        species: (tipo || "otro").toLowerCase(),
        breed: raza || "Mestizo",
        age: { value: ageValue, unit: ageUnit },
        gender: sexo ? sexo.toLowerCase() : "desconocido",
        size: tamano ? tamano.toLowerCase() : "mediano",
        description: finalDescription,
        healthInfo: {
          vaccinated: vacunado === "true" || vacunado === true,
          sterilized: esterilizado === "true" || esterilizado === true,
        },
        location: {
          country: "Colombia",
          city: ubicacion || "No especificada",
        },
        contactInfo: {
          phone: telefono || "",
        },
        photos,
        mainPhoto,
        owner: req.user.id,
        status: "disponible",
      });

      console.log('✅ Mascota creada exitosamente:', nuevaMascota._id);

      res.status(201).json({
        success: true,
        data: nuevaMascota,
        message: 'Mascota publicada exitosamente en adopción'
      });

    } catch (error) {
      console.error('❌ Error al crear mascota:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: errors
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error al publicar mascota'
      });
    }
  });
};

module.exports = exports;