const express = require("express");
const router = express.Router();

const User = require("../models/User");
const auth = require("../middleware/auth"); // 👈 ESTE es tu middleware

// 🔹 GET - Traer notificationSettings
router.get("/notification-settings", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notificationSettings");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user.notificationSettings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// 🔹 PUT - Actualizar notificationSettings
router.put("/notification-settings", auth, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { notificationSettings: req.body },
      { new: true, runValidators: true }
    ).select("notificationSettings");

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      message: "Configuración actualizada correctamente",
      notificationSettings: updatedUser.notificationSettings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

module.exports = router;
