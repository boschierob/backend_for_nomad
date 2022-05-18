const mailjet = require ('node-mailjet').connect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY);


module.exports = {
    mailjet: mailjet,
}
