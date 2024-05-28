  const Response = require('../model/Response')
  const httpStatus = require('http-status')
  const mongoose = require('mongoose')
  const Kategori = require('../model/kategori')
  const User = require('../model/user')
  const validateKategori = require('../utils/KateogriValidator')
  let response = null

  const addKategori = async (req, res) => {
    try {
        const {  namaKategori, user } = await req.body

       
      const kategori = new Kategori({
          namaKategori,
          user,
      })
      const result = await kategori.save()
      console.log(result)
      if (user != null) {
          const userTemp = await User.findById(user)
          if (!userTemp) {
              throw new Error('User not found')
          }
          userTemp.kategori.push(result)
          await userTemp.save()
      }
      console.log(result)
      response = new Response.Success(false, 'Kategori added successfully', result)
        res.status(httpStatus.OK).json(response)
    } catch (error) {
        response = new Response.Error(true, error.message)
      console.error(error)
        res.status(httpStatus.BAD_REQUEST).json(response)
    }
  }
  
  const updateKategori = async (req, res) => {
    try {
      const { namaKategori } = req.body
      const kategori = await Kategori.findById(req.params.id)
      if (!kategori) {
        response = new Response.Error(true, 'Kategori not found')
        return res.status(httpStatus.NOT_FOUND).json(response)
      }
      kategori.namaKategori = namaKategori
      const result = await kategori.save()
      response = new Response.Success(false, 'Kategori updated successfully', result)
      res.status(httpStatus.OK).json(response)
    } catch (error) {
      response = new Response.Error(true, error.message)
      console.error(error)
      res.status(httpStatus.BAD_REQUEST).json(response)
    }
  }
  
  const deleteKategori = async (req, res) => {
    try {
      const kategori = await Kategori.findByIdAndDelete(req.params.id)
      if (!kategori) {
        response = new Response.Error(true, 'Kategori not found')
        return res.status(httpStatus.NOT_FOUND).json(response)
      }

      const user = await User.findOne({ kategori: req.params.id });
      console.log(user)
    if (user) {
      user.kategori.pull(req.params.id);
      await user.save();
    }
      response = new Response.Success(false, 'Kategori deleted successfully', kategori)
      res.status(httpStatus.OK).json(response)
    } catch (error) {
      response = new Response.Error(true, error.message)
      console.error(error)
      res.status(httpStatus.BAD_REQUEST).json(response)
    }
  }
  
  const getAllKategori = async (req, res) => {
    console.log("masuk")
    try {
      console.log("masuk")
      const kategori = await Kategori.findOne()
      console.log(kategori)
      response = new Response.Success(false, 'Kategori retrieved successfully', kategori)
      res.status(httpStatus.OK).json(response)
    } catch (error) {
      response = new Response.Error(true, error.message)
      console.error(error)
      res.status(httpStatus.BAD_REQUEST).json(response)
    }
  }

  const getKategoriById = async (req, res) => {
    try {
      const kategori = await Kategori.findById(req.params.id)
      response = new Response.Success(false, 'Kategori retrieved successfully', kategori)
      res.status(httpStatus.OK).json(response)
    } catch (error) {
      response = new Response.Error(true, error.message)
      console.error(error)
      res.status(httpStatus.BAD_REQUEST).json(response)
    }
  }

  const getKategoriByUserId = async (req, res) => {
    const userId = req.params.id;
    console.log(userId)
    try {
      const kategori = await Kategori.find({ user: userId });
      response = new Response.Success(false, 'Kategori retrieved successfully', kategori)
      res.status(httpStatus.OK).json(response)
    } catch (error) {
      response = new Response.Error(true, error.message)
      console.error(error)
      res.status(httpStatus.BAD_REQUEST).json(response)
    }
  }
  
  
  module.exports = {
    addKategori,
    updateKategori,
    deleteKategori,
    getAllKategori,
    getKategoriById,
    getKategoriByUserId
  }
  