// const { Categorie } = require('../../database')

const getAll = async (req, res) => {

  // let data = await Categorie.findAll();

  res.status(200).json({
		status: 200,
		data: "data"
	})

}


module.exports = {
  getAll,
}
