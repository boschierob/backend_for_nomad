const { prisma } = require('../../services/database');
const { v4: uuidv4 } = require('uuid');

// CREATE
const createUser = async (req, res) => {
  try {
    const {
      email,
      encrypted_password,
      role,
      phone,
      // ... autres champs optionnels
    } = req.body;

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        encrypted_password,
        role,
        phone,
        // ... autres champs si fournis
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    const { encrypted_password: _, ...userWithoutHash } = user;
    res.status(201).json({ status: 201, data: userWithoutHash });
  } catch (error) {
    res.status(400).json({ status: 400, error: error.message });
  }
};

// READ ALL (ignore les utilisateurs supprimés)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ where: { deleted_at: null } });
    const usersWithoutHash = users.map(({ encrypted_password, ...u }) => u);
    res.status(200).json({ status: 200, data: usersWithoutHash });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

// READ ONE (ignore les utilisateurs supprimés)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findFirst({ where: { id, deleted_at: null } });
    if (!user) return res.status(404).json({ status: 404, error: 'User not found' });
    const { encrypted_password, ...userWithoutHash } = user;
    res.status(200).json({ status: 200, data: userWithoutHash });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
};

// UPDATE
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const dataToUpdate = { updated_at: new Date() };
    if (email !== undefined) dataToUpdate.email = email;
    if (role !== undefined) dataToUpdate.role = role;
    const user = await prisma.user.update({ where: { id }, data: dataToUpdate });
    const { encrypted_password, ...userWithoutHash } = user;
    res.status(200).json({ status: 200, data: userWithoutHash });
  } catch (error) {
    res.status(404).json({ status: 404, error: error.message });
  }
};

// DELETE (soft delete)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Vérifie si l'utilisateur existe et n'est pas déjà supprimé
    const user = await prisma.user.findFirst({ where: { id, deleted_at: null } });
    if (!user) {
      return res.status(404).json({ status: 404, error: 'User not found or already deleted' });
    }
    await prisma.user.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    res.status(200).json({ status: 200, message: `User ${id} deleted successfully (soft delete)` });
  } catch (error) {
    res.status(404).json({ status: 404, error: error.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
}; 