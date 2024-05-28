// Import necessary modules
const db = require('../model/riwayat')
// const { validateRiwayat } = require('../validators');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { raw } = require('body-parser')
const multer = require('multer')
const Response = require('../model/Response')
const httpStatus = require('http-status')
const User = require('../model/user')
const validateRiwayat = require('../utils/RiwayatValidator')

const sharp = require('sharp')
const Riwayat = require('../model/riwayat')
const Bulan = require('../model/bulan')
const AsalUang = require('../model/asalUang')
const Kategori = require('../model/kategori')
const Nota = require('../model/Nota')

const { v4: uuidv4 } = require('uuid')

const bucketName = process.env.AWS_BUCKET_NAME
const bucketRegion = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3Client = new S3Client({
  credentials: {
    accessKeyId: 'AKIA2UC3FURGLRPFIXW6',
    secretAccessKey: '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'
  },
  region: 'ap-southeast-1'
})

const upload = multer({
  storage: multer.memoryStorage({})
})

const uploadImage = async (req, res) => {
  try {
  const { originalname, buffer, mimetype } = req.file
  const { activity, date, owner } = req.body
  
  const compressedImage = await sharp(buffer)
    .resize({ width: 500, fit: 'contain' })
    .toBuffer()

  const generateRandomName = () => {
    const characters =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let randomName = ''
    for (let i = 0; i < 10; i++) {
      randomName += characters.charAt(
        Math.floor(Math.random() * characters.length)
      )
    }
    return randomName
  }
  const imageName = `${generateRandomName()}_${Date.now()}.${originalname
    .split('.')
    .pop()}`
  console.log(imageName)
    console.log(owner)
  const params = {
    Bucket: 'image-storage-diskominfo',
    Key: imageName,
    Body: compressedImage,
    ContentType: mimetype
  }

  const upload = await s3Client.send(new PutObjectCommand(params))
  console.log(upload)
  const activit = new Riwayat({
    activity,
    date,
    imgUrl: imageName,
    owner: owner,
  })
  const result = await activit.save()
  console.log(owner)

  console.log(result)
  const ownerTemp = await User.findById(owner)
  console.log(ownerTemp)
  ownerTemp.riwayat.push(result)
  await ownerTemp.save()


  
    console.log(result)
    res.status(200).json({ message: 'Image uploaded successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

const uploadNota = async (req, res) => {  
  try {
    const { originalname, buffer, mimetype } = req.file
    const { activity, date, owner } = req.body
  }catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
const addRiwayat = async (req, res) => {
  let response = null;
  try {
    const { tanggal, asalUang, tipe, kategori, nominal, catatan} = await validateRiwayat.validateAsync(req.body)
    

    const findBulan = { bln: tanggal.getMonth() + 1, tahun: tanggal.getFullYear() };
    console.log(findBulan);
    let newBulan = null;
    let bulanId = null;

    if (tipe === 'pemasukan') {
      const existingBulan = await Bulan.findOne({ bln: findBulan.bln, tahun: findBulan.tahun });
      if (existingBulan) {
        existingBulan.pemasukan += nominal;
        existingBulan.total = existingBulan.pemasukan;
        const result = await existingBulan.save();
        bulanId = existingBulan._id;
        console.log(result)
        console.log("1")
      } else {
        newBulan = new Bulan({
          bln: findBulan.bln,
          tahun: findBulan.tahun,
          pemasukan: nominal,
          pengeluaran: 0,
          total: nominal,
        });
        const result = await newBulan.save();
        console.log(result)
        console.log("2")
        bulanId = newBulan._id;
      }
    } else if (tipe === 'pengeluaran') {
      const existingBulan = await Bulan.findOne({ bln: findBulan.bln, tahun: findBulan.tahun });
      if (existingBulan) {
        console.log("3")
        existingBulan.pengeluaran += nominal;
        existingBulan.total = existingBulan.pemasukan - existingBulan.pengeluaran;
        const result = await existingBulan.save();
        bulanId = existingBulan._id;
        console.log(result)
      } else {
        console.log("4")
        newBulan = new Bulan({
          bln: findBulan.bln,
          tahun: findBulan.tahun,
          pemasukan: 0,
          pengeluaran: nominal,
          total: -nominal,
        });
        const result = await newBulan.save();
        console.log(result)
        bulanId = newBulan._id;
      }
    }

    const newRiwayat = new Riwayat({
      tanggal,
      asalUang,
      tipe,
      kategori,
      nominal,
      catatan,
      owner,
      bulan: bulanId, // Assign bulanId if it exists, otherwise set it to null
    });

    const result = await newRiwayat.save();
   
    if (bulanId) {
      const bulanTemp = await Bulan.findById(bulanId);
      bulanTemp.riwayat.push(result);
      await bulanTemp.save();
    }

    await ownerTemp.save();
    response = new Response.Success(false, 'Riwayat added successfully', result);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.log(response);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};



const updateRiwayat = (req, res) => {
  // Validate request body
  const { error } = validateRiwayat(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  // Extract data from request body
  const { activity, date, imageUrl, owner } = req.body

  // Create an updated activity object
  const updatedRiwayat = {
    activity,
    date,
    imageUrl,
    owner
  }

  // Update the activity in the database
  db.update(req.params.id, updatedRiwayat)
    .then(() => {
      res.status(200).json({ message: 'Riwayat updated successfully' })
    })
    .catch(error => {
      res.status(500).json({ error: 'Internal server error' })
    })
}

// Controller for deleting activity
const deleteRiwayat = async (req, res) => {
  let response = null
  console.log(req.params.id)
  try {
    // const activity = await Riwayat.findById(req.params.id)
    // console.log(activity.imgUrl)
    // const deleteObjectParams = {
    //   Bucket: 'image-storage-diskominfo',
    //   Key: activity.imgUrl
    // }
    // const command = new DeleteObjectCommand(deleteObjectParams)
    // await s3Client.send(command)
    await Riwayat.findByIdAndDelete(req.params.id)
    response = new Response.Success(false, 'Riwayat deleted successfully')
    res.status(200).json({ message: 'Riwayat deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Controller for getting all riwayat

const getBulan = async (req, res) => {
  let response = null
  try{
    const bulan = req.params.bulan
    const tahun = req.params.tahun
    const cekBulan = await Bulan.findOne({bln: bulan, tahun: tahun})
    console.log(cekBulan)
    if(!cekBulan){
      response = new Response.Error(true, 'Bulan not found')
      res.status(httpStatus.NOT_FOUND).json(response)
    }
    response = new Response.Success(false, 'Bulan retrieved successfully', cekBulan)
    res.status(httpStatus.OK).json(response)
  } catch(error){
    response = new Response.Error(true, error.message)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}

const getRiwayatByBulan = (req, res) => {
  let response = null
  try{
    const bulan = req.params.bulan
    const tahun = req.params.tahun
    const riwayat = Riwayat.find({tanggal: {$gte: new Date(tahun, bulan - 1, 1), $lt: new Date(tahun, bulan, 1)}})
    response = new Response.Success(false, 'Riwayat retrieved successfully', riwayat)
    res.status(httpStatus.OK).json(response)
  
  }catch(error){
    response = new Response.Error(true, error.message)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}

const getRiwayatByuser = async (req, res) => {
  let response = null
  try {
    const owner = req.params.owner
    const riwayat = await Riwayat.find({ owner: owner })
    response = new Response.Success(false, 'Riwayat retrieved successfully', riwayat)
    
    response = new Response.Success(
      false,
      'Riwayat retrieved successfully',
      riwayat
    )
    res.status(httpStatus.OK).json(response)
  } catch (error) {
    response = new Response.Error(true, error.message)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}

// Controller for getting a single activity
const getRiwayat = (req, res) => {
  // Get the activity from the database
  db.get(req.params.id)
    .then(activity => {
      if (!activity) {
        return res.status(404).json({ error: 'Riwayat not found' })
      }
      res.status(200).json(activity)
    })
    .catch(error => {
      res.status(500).json({ error: 'Internal server error' })
    })
}

module.exports = {
  addRiwayat,
  updateRiwayat,
  deleteRiwayat,
  getBulan,
  getRiwayatByBulan,
  getRiwayatByuser,
  getRiwayat,
  upload: upload.single('file'),
  uploadImage
}
