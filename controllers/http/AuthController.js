const { Validator } = require('node-input-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { mailjet } = require('../../service/mailjet')
const moment = require('moment');
const db = require('../../service/database');
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
    const token = jwt.sign({ identity: user.email }, process.env.APP_JWT, { expiresIn: '7d' });
    return res.status(200).json({
      status: 200,
      data: {
        user: user,
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
  const checkEmail = User.findOne({where: {email: req.body.email}})
  if (checkEmail){
    return res.status(409).json({
      status: 409,
      message: "Email already exist !"
    })
  }
  const user = new User();
  user.email = req.body.email;
  user.password = await bcrypt.hashSync(req.body.password, 10);
  await user.save()
  const token = jwt.sign({ identity: user.email }, process.env.APP_JWT, { expiresIn: '7d' });
  return res.status(200).json({
    status: 200,
    data: {
      user: user,
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
  User.findOne({where: {email: req.body.email}})
    .then(function(user) {
      if (user == null){
        return res.status(401).json({
          status: 401,
          error: "Email don't match !"
        })
      }
    })
    .catch(function(err) {
      console.error(err)
      return res.status(409).json({
        status: 409,
        error: err
      })
    });
  const key = jwt.sign({ email: req.body.email }, process.env.APP_JWT, { expiresIn: '1h' });
  ResetPassword.create({email: req.body.email, token: key})
    .then(function() {
      mailjet.post("send", {'version': 'v3.1'}).request({
        "Messages":[
          {
            "From": {
              "Email": "reset@platypus-sender.fr",
              "Name": "Platypus Sender"
            },
            "To": [
              {
                "Email": req.body.email,
                "Name": req.body.email
              }
            ],
            "Subject": "Réinitialisation mots de passe.",
            "TextPart": "Réinitialisation du mots de passe",
            "HTMLPart": "<h3>Nous avons cru comprendre que vous vouliez réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous et vous serez redirigé vers un site sécurisé où vous pourrez définir un nouveau mot de passe.<br>  <a href='https://platypus-sender.fr/reset?token="+key+"'>Click ici</a>!</h3><br />Platypus Sender",
          }
        ]
      })
      return res.status(200).json({
    		status: 200,
    		data: req.body.email
      })
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
  jwt.verify(req.body.token, process.env.APP_JWT, function(err, decoded) {
    console.log(err);
    if (decoded){
      console.log(decoded.exp);
      const reset = ResetPassword.findOne({where: {email: decoded.email, token:req.body.token}})
      console.log(reset);
      if (reset){
        ResetPassword.update({password: req.body.password}, {where: {email: decoded.email}})
        return res.status(200).json({
          status: 200,
          data: req.body.email
        })
      }else{
        return res.status(403).json({
          status: 403,
          data: "access forbidden"
        })
      }
    } else {
      return res.status(403).json({
        status: 403,
        data: "access forbidden"
      })
    }
  });
}


module.exports = {
  login,
  register,
  forgetPassword,
  resetPassword,
}
