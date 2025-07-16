const { Validator } = require('node-input-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { mailjet } = require('../../services/mailjet');
const generator = require('generate-password');
const { v4: uuidv4 } = require('uuid'); // Pour la génération d'UUID
const { prisma } = require('../../services/database'); // Prisma centralisé
const jwksClient = require('jwks-rsa');

console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);

// Remplace <TON-PROJET> par le vrai nom de ton projet Supabase
const client = jwksClient({
  jwksUri: 'https://hvhpfjkiesiaygxycynt.supabase.co/auth/v1/jwks',
  requestHeaders: {
    apikey: process.env.SUPABASE_ANON_KEY
  }
});

function getKey(header, callback, res) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err || !key) {
      console.error('[GoogleAuth] JWKS error:', err);
      if (res) {
        return res.status(500).json({ status: 500, error: "JWKS key not found", details: err?.message });
      }
      return callback(new Error('JWKS key not found'), null);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const login = async (req, res) => {
  const v = new Validator(req.body, {
    email: 'required|email',
    password: 'required',
  });
  const matched = await v.check();
  if (!matched) {
    return res.status(422).json({
      status: 422,
      error: v.errors
    });
  }
  // Recherche l'utilisateur par email (findFirst car email n'est pas unique)
  let user = await prisma.user.findFirst({ where: { email: req.body.email } });
  if (!user) {
    return res.status(401).json({
      status: 401,
      error: "Email don't match !"
    });
  }
  const compare = await bcrypt.compare(req.body.password, user.encrypted_password);
  if (compare) {
    const token = jwt.sign({ 
      identity: user.email,
      role: user.role
    }, process.env.APP_JWT, { expiresIn: '7d' });
    const { encrypted_password, ...userWithoutHash } = user;
    return res.status(200).json({
      status: 200,
      data: {
        user: userWithoutHash,
        token: token
      }
    });
  } else {
    return res.status(401).json({
      status: 401,
      error: "Password don't match !"
    });
  }
};

const register = async (req, res) => {
  const v = new Validator(req.body, {
    email: 'required|email',
    password: 'required|minLength:5',
  });
  const matched = await v.check();
  if (!matched) {
    return res.status(422).json({
      status: 422,
      error: v.errors
    });
  }
  // Check if user already exists
  const userExists = await prisma.user.findFirst({ where: { email: req.body.email } });
  if (userExists) {
    return res.status(409).json({
      status: 409,
      message: "Email already exist !"
    });
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  // Génère un UUID pour le champ id
  const id = uuidv4();
  // Insert new user avec Prisma ORM
  const user = await prisma.user.create({
    data: {
      id: id,
      email: req.body.email,
      encrypted_password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  // Generate JWT token (optional, as before)
  const token = jwt.sign({
    identity: req.body.email,
    // role: user.role // if you want to include role
  }, process.env.APP_JWT, { expiresIn: '7d' });
  // Remove sensitive info from response
  const { encrypted_password, ...userWithoutHash } = user;
  return res.status(200).json({
    status: 200,
    data: {
      user: userWithoutHash,
      token: token
    }
  });
};

const forgetPassword = async (req, res) => {
  const v = new Validator(req.body, {
    email: 'required|email',
  });
  const matched = await v.check();
  if (!matched) {
    return res.status(422).json({
      status: 422,
      error: v.errors
    });
  }
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user){
    return res.status(401).json({
      status: 401,
      error: "Email don't match !"
    });
  }
  const key = generator.generate({length: 40, numbers: true});
  await prisma.user.update({
    where: { email: req.body.email },
    data: { recovery_token: key, updated_at: new Date() }
  });
  mailjet.post("send", {'version': 'v3.1'}).request({
    "Messages":[
      {
        "From": {
          "Email": "noreply@uslow.io",
          "Name": "Uslow"
        },
        "To": [
          {
            "Email": req.body.email,
            "Name": req.body.email
          }
        ],
        "Subject": "Réinitialisation mots de passe.",
        "TextPart": "Réinitialisation du mots de passe",
        "HTMLPart": `<h3>Nous avons cru comprendre que vous vouliez réinitialiser votre mot de passe.<br>Cliquez sur le lien ci-dessous et vous serez redirigé vers un site sécurisé où vous pourrez définir un nouveau mot de passe.<br><br>  <a href='https://uslow.io/reset?token=${key}'>Click ici</a>!</h3><br />L'équipe Uslow`,
      }
    ]
  });
  return res.status(200).json({
    status: 200,
    data: req.body.email
  });
};

const resetPassword = async (req, res) => {
  const v = new Validator(req.body, {
    token: 'required',
    password: 'required|minLength:5',
  });
  const matched = await v.check();
  if (!matched) {
    return res.status(422).json({
      status: 422,
      error: v.errors
    });
  }
  const user = await prisma.user.findFirst({ where: { recovery_token: req.body.token } });
  if (user) {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { encrypted_password: hashedPassword, recovery_token: null, updated_at: new Date() }
    });
    return res.status(200).json({
      status: 200,
      data: req.body.email
    });
  }
  return res.status(403).json({
    status: 403,
    data: "access forbidden"
  });
};

const updateUser = async (req, res) => {
  const v = new Validator(req.body, {
    id: 'required',
    email: 'email', // optionnel, mais si fourni doit être un email
    role: 'string', // optionnel
    // Ajoute ici d'autres champs modifiables si besoin
  });
  const matched = await v.check();
  if (!matched) {
    return res.status(422).json({
      status: 422,
      error: v.errors
    });
  }
  // Prépare les données à mettre à jour (on ne met à jour que ce qui est fourni)
  const { id, email, role } = req.body;
  const dataToUpdate = {};
  if (email !== undefined) dataToUpdate.email = email;
  if (role !== undefined) dataToUpdate.role = role;
  dataToUpdate.updated_at = new Date();

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });
    const { encrypted_password, ...userWithoutHash } = updatedUser;
    return res.status(200).json({
      status: 200,
      data: userWithoutHash
    });
  } catch (error) {
    return res.status(404).json({
      status: 404,
      error: "User not found or update failed",
      details: error.message
    });
  }
};

const logout = async (req, res) => {
  // Si tu veux juste un logout stateless :
  return res.status(200).json({
    status: 200,
    message: "Logged out. Please delete your token client-side."
  });
};

module.exports = {
  login,
  register,
  forgetPassword,
  resetPassword,
  updateUser,
  logout,
};
