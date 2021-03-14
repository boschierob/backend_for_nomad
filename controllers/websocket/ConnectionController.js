// const { Categorie } = require('../../database')
const connect = async (socket) => {

  // let data = await Categorie.findAll();
  console.log(`Connecté au client ${socket.id}`)


}

const disconnect = async (socket) => {

  console.log(`deconection au client ${socket.id}`)

}


module.exports = {
  connect,
  disconnect,
}
