const { prisma } = require('../../services/database');

const testDbConnection = async (req, res) => {
  try {
    // On fait une requête simple sur la table users
    const count = await prisma.user.count();
    res.status(200).json({ status: 200, message: 'Connexion à la base OK', userCount: count });
  } catch (error) {
    res.status(500).json({ status: 500, message: 'Erreur de connexion à la base', error: error.message });
  }
};

module.exports = { testDbConnection }; 