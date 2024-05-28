const Response = require('../model/Response')
const httpStatus = require('http-status')

const AsalUang = require('../model/asalUang')
const User = require('../model/user')
// const validateAsalUang = require('../utils/AsalUangValidator')
let response = null

const addAsalUang = async (req, res) => {
  try {
      const {  tipeAsalUang, user  } = await req.body

    const asalUang = new AsalUang({
      tipeAsalUang,
      user,
    })
    const result = await asalUang.save()

    if (user != null) {
      const userTemp = await User.findById(user)
      if (!userTemp) {
          throw new Error('User not found')
      }
      userTemp.asalUang.push(result)
      await userTemp.save()
  }

    console.log(result)
    response = new Response.Success(false, 'AsalUang added successfully', result)
      res.status(httpStatus.OK).json(response)
  } catch (error) {
      response = new Response.Error(true, error.message)
    console.error(error)
      res.status(httpStatus.BAD_REQUEST).json(response)
  }
}

const updateAsalUang = async (req, res) => {
  try {
    const { tipeAsalUang } = await req.body
    const asalUang = await AsalUang.findById(req.params.id)
    if (!asalUang) {
      response = new Response.Error(true, 'AsalUang not found')
      return res.status(httpStatus.NOT_FOUND).json(response)
    }
    asalUang.tipeAsalUang = tipeAsalUang
    const result = await asalUang.save()
    response = new Response.Success(false, 'AsalUang updated successfully', result)
    res.status(httpStatus.OK).json(response)
  } catch (error) {
    response = new Response.Error(true, error.message)
    console.error(error)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}

const deleteAsalUang = async (req, res) => {
  try {
    const asalUang = await AsalUang.findByIdAndDelete(req.params.id)
    if (!asalUang) {
      response = new Response.Error(true, 'AsalUang not found')
      return res.status(httpStatus.NOT_FOUND).json(response)
    }
    response = new Response.Success(false, 'AsalUang deleted successfully', asalUang)
    res.status(httpStatus.OK).json(response)
  } catch (error) {
    response = new Response.Error(true, error.message)
    console.error(error)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}

const getAllAsalUang = async (req, res) => {
  try {
    const asalUang = await AsalUang.find()
    response = new Response.Success(false, 'AsalUang retrieved successfully', asalUang)
    res.status(httpStatus.OK).json(response)
  } catch (error) {
    response = new Response.Error(true, error.message)
    console.error(error)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}

const getAsalUangById = async (req, res) => {
  try {
    const asalUang = await AsalUang.findById(req.params.id)
    response = new Response.Success(false, 'AsalUang retrieved successfully', asalUang)
    res.status(httpStatus.OK).json(response)
  } catch (error) {
    response = new Response.Error(true, error.message)
    console.error(error)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}

const getAsalUangByUserId = async (req, res) => {
  const userId = req.params.id;
  console.log(userId)
  try {
    const asalUang = await AsalUang.find({ user: userId });
    response = new Response.Success(false, 'AsalUang retrieved successfully', asalUang)
    res.status(httpStatus.OK).json(response)
  } catch (error) {
    response = new Response.Error(true, error.message)
    console.error(error)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}


module.exports = {
  addAsalUang,
  updateAsalUang,
  deleteAsalUang,
  getAllAsalUang,
  getAsalUangById,
  getAsalUangByUserId
}
