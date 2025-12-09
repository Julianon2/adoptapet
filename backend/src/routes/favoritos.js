// POST /favorites/add
router.post("/add", async (req, res) => {
  const { userId, petId } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  if (!user.favorites.includes(petId)) {
    user.favorites.push(petId);
  }

  await user.save();
  res.json({ success: true, favorites: user.favorites });
});

// DELETE /favorites/remove
router.post("/remove", async (req, res) => {
  const { userId, petId } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  user.favorites = user.favorites.filter(id => id !== petId);

  await user.save();
  res.json({ success: true, favorites: user.favorites });
});
