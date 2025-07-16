import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (user) {
      console.log('Premier utilisateur trouvé :', user);
    } else {
      console.log('Aucun utilisateur trouvé dans la table user.');
    }
  } catch (e) {
    console.error('Erreur de connexion ou de requête Prisma :', e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main(); 