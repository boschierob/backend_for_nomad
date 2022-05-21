const { Validator } = require('node-input-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { mailjet } = require('../../services/mailjet')
const generator = require('generate-password');
const db = require('../../services/database');
const User = db.User;

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
  	})
  }
  let user = await User.findOne({email: req.body.email})
  if (!user) {
    return res.status(401).json({
      status: 401,
      error: "Email don't match !"
    })
  }
  const compare = await bcrypt.compare(req.body.password, user.password)
  if (compare){
    const token = jwt.sign({ 
      identity: user.email,
      role: user.role
    }, process.env.APP_JWT, { expiresIn: '7d' });
    const { password, ...userWithoutHash } = user.toObject();
    return res.status(200).json({
      status: 200,
      data: {
        user: userWithoutHash,
        token: token
      }
    })
  } else {
    return res.status(401).json({
      status: 401,
      error: "Password don't match !"
    })
  }
}

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
    })
  }
  const checkEmail = await User.findOne({email: req.body.email})
  if (checkEmail){
    return res.status(409).json({
      status: 409,
      message: "Email already exist !"
    })
  }
  const user = new User();
  user.email = req.body.email;
  user.role = ['user']
  user.password = await bcrypt.hashSync(req.body.password, 10);
  await user.save()
  const token = jwt.sign({
      identity: user.email,
      role: user.role
    }, process.env.APP_JWT, { expiresIn: '7d' });
  const { password, ...userWithoutHash } = user.toObject();
  return res.status(200).json({
    status: 200,
    data: {
      user: userWithoutHash,
      token: token
    }
  })
}

const forgetPassword = async (req, res) => {

  const v = new Validator(req.body, {
    email: 'required|email',
  });
  const matched = await v.check();
  if (!matched) {
    return res.status(422).json({
  		status: 422,
  		error: v.errors
  	})
  }
  const user = await User.findOne({email: req.body.email})
  if (!user){
    return res.status(401).json({
      status: 401,
      error: "Email don't match !"
    })
  }
  const key = generator.generate({length: 40, numbers: true});
  user.tokenResetPassword = key;
  await user.save()
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
        "HTMLPart": "<h3>Nous avons cru comprendre que vous vouliez réinitialiser votre mot de passe.<br>Cliquez sur le lien ci-dessous et vous serez redirigé vers un site sécurisé où vous pourrez définir un nouveau mot de passe.<br><br>  <a href='https://uslow.io/reset?token="+key+"'>Click ici</a>!</h3><br />L'équipe Uslow",
      }
    ]
  })
  return res.status(200).json({
    status: 200,
    data: req.body.email
  })
}

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
  	})
  }
  console.log(req.body.token)
  const user = await User.findOne({ tokenResetPassword: req.body.token})
  if (user) {
    user.password = await bcrypt.hashSync(req.body.password, 10);
    user.tokenResetPassword = null;
    await user.save()
    return res.status(200).json({
      status: 200,
      data: req.body.email
    })
  }

  return res.status(403).json({
    status: 403,
    data: "access forbidden"
  })
  
}


module.exports = {
  login,
  register,
  forgetPassword,
  resetPassword,
}
