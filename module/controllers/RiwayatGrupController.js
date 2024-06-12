const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Response = require('../model/Response');
const httpStatus = require('http-status');

const addRiwayat = async (req, res) => {
  let response = null;
  try {
    const { tanggal, tipe, nominal, catatan, asalUangId, kategoriId, notaId, userId } = req.body;

    console.log(Date(tanggal))
    const findBulan = { bln: new Date(tanggal).getMonth() + 1, tahun: new Date(tanggal).getFullYear() };
    let newBulan = null;
    let bulanId = null;

    if (tipe === 'Pemasukan') {
      const existingBulan = await prisma.bulan.findFirst({
      where: {
        bln: findBulan.bln.toString(),
        tahun: findBulan.tahun.toString(),
        userId: parseInt(userId),
      },
      });
      if (existingBulan) {
      const updatedBulan = await prisma.bulan.update({
        where: { id: existingBulan.id },
        data: {
        pemasukan: { increment: parseFloat(nominal) },
        total: { increment: parseFloat(nominal) },
        },
      });
      bulanId = updatedBulan.id;
      } else {
      newBulan = await prisma.bulan.create({
        data: {
        userId: parseInt(userId),
        bln: findBulan.bln.toString(),
        tahun: findBulan.tahun.toString(),
        pemasukan: parseFloat(nominal),
        pengeluaran: 0,
        total: parseFloat(nominal),
        },
      });
      bulanId = newBulan.id;
      }
    } else if (tipe === 'Pengeluaran') {
      const existingBulan = await prisma.bulan.findFirst({
      where: {
        bln: findBulan.bln.toString(),
        tahun: findBulan.tahun.toString(),
        userId: parseInt(userId),
      },
      });
      if (existingBulan) {
      const updatedBulan = await prisma.bulan.update({
        where: { id: existingBulan.id },
        data: {
        pengeluaran: { increment: parseFloat(nominal) },
        total: { increment: -parseFloat(nominal) },
        },
      });
      bulanId = updatedBulan.id;
      } else {
      newBulan = await prisma.bulan.create({
        data: {
        userId: parseInt(userId),
        bln: findBulan.bln.toString(),
        tahun: findBulan.tahun.toString(),
        pemasukan: 0,
        pengeluaran: parseFloat(nominal),
        total: -parseFloat(nominal),
        },
      });
      bulanId = newBulan.id;
      }
    }

    const date = new Date(tanggal);

   const isoTanggal = date.toISOString();

    const riwayat = await prisma.riwayat.create({
      data: {
        tanggal: isoTanggal,
        tipe,
        nominal: parseFloat(nominal),
        catatan,
        asalUangId: parseInt(asalUangId),
        kategoriId: parseInt(kategoriId),
        bulanId: parseInt(bulanId),
        notaId,
      },
    });

    response = new Response.Success(false, 'Riwayat added successfully', riwayat);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const updateRiwayat = async (req, res) => {
  let response = null;
  try {
    const id  = req.params.id;
    const { tanggal, tipe, nominal, catatan, asalUangId, kategoriId, bulanId, notaId } = req.body;

    const riwayat = await prisma.riwayat.update({
      where: { id: Number(id) },
      data: {
        tanggal,
        tipe,
        nominal,
        catatan,
        asalUangId,
        kategoriId,
        bulanId,
        notaId,
      },
    });

    response = new Response.Success(false, 'Riwayat updated successfully', riwayat);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const deleteRiwayat = async (req, res) => {
  let response = null;
  try {
    const id = req.params.id;

    const riwayat = await prisma.riwayat.findUnique({
      where: { id: Number(id) },
      include: {
        bulan: true,
      },
    });

    if (riwayat) {
      const { tipe, nominal, bulanId } = riwayat;

      if (tipe === 'Pemasukan') {
        const updatedBulan = await prisma.bulan.update({
          where: { id: bulanId },
          data: {
            pemasukan: { decrement: parseFloat(nominal) },
            total: { decrement: parseFloat(nominal) },
          },
        });
      } else if (tipe === 'Pengeluaran') {
        const updatedBulan = await prisma.bulan.update({
          where: { id: bulanId },
          data: {
            pengeluaran: { decrement: parseFloat(nominal) },
            total: { increment: parseFloat(nominal) },
          },
        });
      }

      await prisma.riwayat.delete({
        where: { id: Number(id) },
        
      });

      response = new Response.Success(false, 'Riwayat deleted successfully', riwayat);
      res.status(httpStatus.OK).json(response);
    } else {
      response = new Response.Error(true, 'Riwayat not found');
      res.status(httpStatus.NOT_FOUND).json(response);
    }
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getRiwayatByBulanId = async (req, res) => {
  let response = null;
  try {
    const bulanId  = req.params.id;
    console.log(bulanId)
    const riwayat = await prisma.riwayat.findMany({
      where: { bulanId: Number(bulanId) },
      include: {
        asalUang: true,
        kategori: true,
        nota: true,
        bulan: true,
      },
    });

    response = new Response.Success(false, 'Riwayat retrieved successfully', riwayat);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};


const getBulanByBulanAndTahun = async (req, res) => {
  let response = null;
  try {
    const bulan = req.params.bulan;
    const tahun = req.params.tahun;
    const userId = req.params.userId;

    const bulanData = await prisma.bulan.findFirst({
      where: {
        bln: bulan.toString(),
        tahun: tahun.toString(),
        userId: parseInt(userId),
      },
    });

    if (bulanData) {
      response = new Response.Success(false, 'Bulan data retrieved successfully', bulanData);
      res.status(httpStatus.OK).json(response);
    } else {
      response = new Response.Error(true, 'Bulan data not found');
      res.status(httpStatus.NOT_FOUND).json(response);
    }
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getRiwayatByUserId = async (req, res) => {
  let response = null;
  try {
    const userId = req.params.id;

    const riwayat = await prisma.riwayat.findMany({
      where: {
        bulan: {
          userId: parseInt(userId),
        },
      },
      include: {
        asalUang: true,
        kategori: true,
        nota: true,
        bulan: true,
      },
    });

    response = new Response.Success(false, 'All Riwayat retrieved successfully', riwayat);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

module.exports = {
  addRiwayat,
  updateRiwayat,
  deleteRiwayat,
  getRiwayatByBulanId,
  getRiwayatByUserId,
  getBulanByBulanAndTahun,
};