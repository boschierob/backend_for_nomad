const getAll = async (req, res) => {

  res.status(200).json({
		status: 200,
		data: "data"
	})

}

const secure = async (req, res) => {

  res.status(200).json({
    status: 200,
    data: "data"
  })

}


module.exports = {
  getAll,
  secure
}
