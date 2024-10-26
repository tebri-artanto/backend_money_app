const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Response = require("../model/Response");
const httpStatus = require("http-status");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { raw } = require("body-parser");
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

require("dotenv").config();
const bucketName = process.env.AWS_BUCKET_NAME;
const bucketRegion = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },

  region: bucketRegion,
});

const upload = multer({
  storage: multer.memoryStorage({}),
});
const addRiwayat = async (req, res) => {
  let response = null;
  try {
    console.log(req.body);

    const { tanggal, tipe, nominal, catatan, asalUangId, kategoriId, userId } =
      req.body;
    const { originalname, buffer, mimetype } = req.file || {};

    const findBulan = {
      bln: new Date(tanggal).getMonth() + 1,
      tahun: new Date(tanggal).getFullYear(),
    };
    let bulanId = null;

    console.log(findBulan);

    let detailBudgetId = null;
    console.log(tipe);
    console.log(kategoriId);
    
    // Check budget for both Pengeluaran and Tabungan types
    if (tipe === "Pengeluaran" || tipe === "Tabungan") {
      const findBudgets = await prisma.budget.findMany({
        where: {
          kategoriId: parseInt(kategoriId),
          status: "Aktif",
        },
      });
      console.log(findBudgets);

      if (findBudgets.length > 0) {
        console.log("masuk sini");
        for (const budget of findBudgets) {
          console.log(budget.id);
          console.log(new Date(tanggal));
          const findDetailBudget = await prisma.detailBudget.findFirst({
            where: {
              budgetId: budget.id,
              tanggalMulai: { lte: new Date(tanggal) },
              tanggalSelesai: { gte: new Date(tanggal) },
            },
          });

          console.log(findDetailBudget);

          if (findDetailBudget) {
            await prisma.detailBudget.update({
              where: { id: findDetailBudget.id },
              data: {
                sisaBudget: { decrement: parseFloat(nominal) },
                terpakai: { increment: parseFloat(nominal) },
              },
            });

            detailBudgetId = findDetailBudget.id;
            break;
          }
        }
      }
    }

    const existingBulan = await prisma.bulan.findFirst({
      where: {
        bln: findBulan.bln.toString(),
        tahun: findBulan.tahun.toString(),
        userId: parseInt(userId),
      },
    });

    if (existingBulan) {
      const updatedData = {};
      
      switch(tipe) {
        case "Pemasukan":
          updatedData.pemasukan = { increment: parseFloat(nominal) };
          updatedData.total = { increment: parseFloat(nominal) };
          break;
        case "Pengeluaran":
          updatedData.pengeluaran = { increment: parseFloat(nominal) };
          updatedData.total = { decrement: parseFloat(nominal) };
          break;
        case "Tabungan":
          updatedData.tabungan = { increment: parseFloat(nominal) };
          updatedData.total = { decrement: parseFloat(nominal) };
          break;
      }

      const updatedBulan = await prisma.bulan.update({
        where: { id: existingBulan.id },
        data: updatedData,
      });
      bulanId = updatedBulan.id;
    } else {
      const newBulan = await prisma.bulan.create({
        data: {
          userId: parseInt(userId),
          bln: findBulan.bln.toString(),
          tahun: findBulan.tahun.toString(),
          pemasukan: tipe === "Pemasukan" ? parseFloat(nominal) : 0,
          pengeluaran: tipe === "Pengeluaran" ? parseFloat(nominal) : 0,
          tabungan: tipe === "Tabungan" ? parseFloat(nominal) : 0,
          total: tipe === "Pemasukan" ? 
            parseFloat(nominal) : 
            -parseFloat(nominal), 
        },
      });
      bulanId = newBulan.id;
    }

    const date = new Date(tanggal);
    const isoTanggal = date.toISOString();

    let notaId = null;
    if (req.file) {
      const imageName = `${generateRandomName()}_${Date.now()}.${originalname
        .split(".")
        .pop()}`;
      const params = {
        Bucket: bucketName,
        Key: imageName,
        Body: buffer,
        ContentType: mimetype,
      };

      await s3Client.send(new PutObjectCommand(params));

      const newNota = await prisma.nota.create({
        data: { imagePath: imageName },
      });
      notaId = newNota.id;
    }

    const riwayat = await prisma.riwayat.create({
      data: {
        tanggal: isoTanggal,
        tipe,
        nominal: parseFloat(nominal),
        catatan,
        asalUangId: parseInt(asalUangId),
        kategoriId: parseInt(kategoriId),
        bulanId: parseInt(bulanId),
        notaId: notaId ? parseInt(notaId) : undefined,
        detailBudgetId: detailBudgetId ? parseInt(detailBudgetId) : undefined,
      },
    });

    response = new Response.Success(
      false,
      "Riwayat added successfully",
      riwayat
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    console.error(error);
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

function generateRandomName() {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array(10)
    .fill()
    .map(() => characters.charAt(Math.floor(Math.random() * characters.length)))
    .join("");
}

const updateRiwayat = async (req, res) => {
  let response = null;
  try {
    const id = req.params.id;
    console.log(id);
    const { tanggal, tipe, nominal, catatan, asalUangId, kategoriId, bulanId } =
      req.body;
    const { originalname, buffer, mimetype } = req.file || {};

    console.log(req.file);
    console.log(req.body);

    const existingRiwayat = await prisma.riwayat.findUnique({
      where: { id: Number(id) },
      include: {
        nota: true,
        detailBudget: true,
        kategori: true,
      },
    });

    if (!existingRiwayat) {
      response = new Response.Error(true, "Riwayat not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    let notaId = existingRiwayat.notaId;

    if (req.file) {
      if (existingRiwayat.nota) {
        const params = {
          Bucket: bucketName,
          Key: existingRiwayat.nota.imagePath,
        };
        await s3Client.send(new DeleteObjectCommand(params));
        await prisma.nota.delete({ where: { id: existingRiwayat.notaId } });
      }

      const imageName = `${generateRandomName()}_${Date.now()}.${originalname
        .split(".")
        .pop()}`;
      const params = {
        Bucket: bucketName,
        Key: imageName,
        Body: buffer,
        ContentType: mimetype,
      };
      await s3Client.send(new PutObjectCommand(params));
      const newNota = await prisma.nota.create({
        data: { imagePath: imageName },
      });
      notaId = newNota.id;
    }

    const date = new Date(tanggal);
    const isoTanggal = date.toISOString();

    let updatedRiwayat;

    const existingBulan = await prisma.bulan.findUnique({
      where: { id: parseInt(bulanId) },
    });

    

    if (existingBulan) {
      let updateData = {};
      const nominalDiff = parseFloat(nominal) - existingRiwayat.nominal;
        switch(tipe) {
          case "Pemasukan":
            updateData = {
              pemasukan: { increment: nominalDiff },
              total: { increment: nominalDiff },
            };
            break;
          case "Pengeluaran":
            updateData = {
              pengeluaran: { increment: nominalDiff },
              total: { decrement: nominalDiff },
            };
            break;
          case "Tabungan":
            updateData = {
              tabungan: { increment: nominalDiff },
              total: { decrement: nominalDiff },
            };
            break;
        }
      await prisma.bulan.update({
        where: { id: parseInt(bulanId) },
        data: updateData,
      });
    }

    if (existingRiwayat.detailBudget) {
      await prisma.detailBudget.update({
        where: { id: existingRiwayat.detailBudget.id },
        data: {
          sisaBudget: { increment: parseFloat(existingRiwayat.nominal) },
          terpakai: { decrement: parseFloat(existingRiwayat.nominal) },
        },
      });
    }

    const newBudget = await prisma.budget.findFirst({
      where: {
        kategoriId: parseInt(kategoriId),
        status: "Aktif",
      },
    });

    let detailBudgetId = null;
    if (newBudget) {
      const findDetailBudget = await prisma.detailBudget.findFirst({
        where: {
          budgetId: newBudget.id,
          tanggalMulai: { lte: new Date(tanggal) },
          tanggalSelesai: { gte: new Date(tanggal) },
        },
      });

      if (findDetailBudget) {
        await prisma.detailBudget.update({
          where: { id: findDetailBudget.id },
          data: {
            sisaBudget: { decrement: parseFloat(nominal) },
            terpakai: { increment: parseFloat(nominal) },
          },
        });

        detailBudgetId = findDetailBudget.id;
      }
    }

    updatedRiwayat = await prisma.riwayat.update({
      where: { id: Number(id) },
      data: {
        tanggal: isoTanggal,
        tipe,
        nominal: parseFloat(nominal),
        catatan,
        asalUangId: parseInt(asalUangId),
        kategoriId: parseInt(kategoriId),
        bulanId: parseInt(bulanId),
        notaId,
        detailBudgetId,
      },
    });

    response = new Response.Success(
      false,
      "Riwayat updated successfully",
      updatedRiwayat
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    console.error(error);
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
        nota: true,
        detailBudget: true,
      },
    });

    if (!riwayat) {
      response = new Response.Error(true, "Riwayat not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    const { tipe, nominal, bulanId, notaId, detailBudgetId } = riwayat;

    if (tipe === "Pemasukan") {
      await prisma.bulan.update({
        where: { id: bulanId },
        data: {
          pemasukan: { decrement: parseFloat(nominal) },
          total: { decrement: parseFloat(nominal) },
        },
      });
    } else if (tipe === "Pengeluaran") {
      await prisma.bulan.update({
        where: { id: bulanId },
        data: {
          pengeluaran: { decrement: parseFloat(nominal) },
          total: { increment: parseFloat(nominal) },
        },
      });

      if (detailBudgetId) {
        await prisma.detailBudget.update({
          where: { id: detailBudgetId },
          data: {
            sisaBudget: { increment: parseFloat(nominal) },
            terpakai: { decrement: parseFloat(nominal) },
          },
        });
      }
    } else if (tipe === "Tabungan") {
      await prisma.bulan.update({
        where: { id: bulanId },
        data: {
          tabungan: { decrement: parseFloat(nominal) },
          total: { increment: parseFloat(nominal) },
        },
      });
    }

    await prisma.riwayat.update({
      where: { id: Number(id) },
      data: { deleted: true },
    });

    response = new Response.Success(
      false,
      "Riwayat deleted successfully",
      riwayat
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const deleteNota = async (req, res) => {
  let response = null;
  try {
    const notaId = req.params.id;
    const nota = await prisma.nota.findUnique({
      where: { id: Number(notaId) },
    });

    if (nota) {
      const params = {
        Bucket: bucketName,
        Key: nota.imagePath,
      };

      await s3Client.send(new DeleteObjectCommand(params));
      await prisma.nota.delete({
        where: { id: Number(notaId) },
      });
    }
    response = new Response.Success(false, "Nota deleted successfully", nota);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    console.error(error);
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getRiwayatById = async (req, res) => {
  let response = null;
  try {
    const id = req.params.id;

    const riwayat = await prisma.riwayat.findUnique({
      where: {
        id: Number(id),
        deleted: false,
      },
      include: {
        asalUang: true,
        kategori: true,
        nota: {
          select: {
            id: true,
            imagePath: true,
          },
        },
        bulan: true,
      },
    });

    if (riwayat) {
      let notaImageUrl = null;
      console.log(riwayat.nota);
      if (riwayat.nota && riwayat.nota.imagePath) {
        const params = {
          Bucket: bucketName,
          Key: riwayat.nota.imagePath,
        };

        const command = new GetObjectCommand(params);
        notaImageUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 4000,
        });
      }

      const riwayatWithImageUrl = {
        ...riwayat,
        notaImageUrl,
      };

      response = new Response.Success(
        false,
        "Riwayat retrieved successfully",
        riwayatWithImageUrl
      );
      res.status(httpStatus.OK).json(response);
    } else {
      response = new Response.Error(true, "Riwayat not found");
      res.status(httpStatus.NOT_FOUND).json(response);
    }
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
      response = new Response.Success(
        false,
        "Bulan data retrieved successfully",
        bulanData
      );
      res.status(httpStatus.OK).json(response);
    } else {
      response = new Response.Error(true, "Bulan data not found");
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
        deleted: false,
      },
      include: {
        asalUang: true,
        kategori: true,
        nota: true,
        bulan: true,
      },
    });

    response = new Response.Success(
      false,
      "All Riwayat retrieved successfully",
      riwayat
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getRiwayatByDetailBudgetId = async (req, res) => {
  let response = null;
  try {
    const detailBudgetId = req.params.id;

    const riwayat = await prisma.riwayat.findMany({
      where: {
        detailBudgetId: Number(detailBudgetId),
        tipe: "Pengeluaran",
        deleted: false,
      },
      include: {
        asalUang: true,
        kategori: true,
        nota: true,
        bulan: true,
      },
    });

    response = new Response.Success(
      false,
      "All Riwayat retrieved successfully",
      riwayat
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getRiwayatByUserIdWeekly = async (req, res) => {
  let response = null;
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentDay = currentDate.getDay();

    let startDate = new Date(currentDate);
    let endDate = new Date(currentDate);

    if (currentDay === 0) {
      endDate.setDate(startDate.getDate() + 6);
    } else {
      const daysToPreviousSunday = currentDay;
      startDate.setDate(currentDate.getDate() - daysToPreviousSunday);
      endDate.setDate(startDate.getDate() + 6);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const riwayat = await prisma.riwayat.findMany({
      where: {
        bulan: {
          userId: parseInt(userId),
        },
        tanggal: {
          gte: startDate.toISOString(),
          lte: endDate.toISOString(),
        },
        deleted: false,
      },
      include: {
        asalUang: true,
        kategori: true,
        nota: true,
        bulan: true,
      },
    });
console.log(riwayat);
    response = new Response.Success(
      false,
      "Riwayat retrieved successfully",
      riwayat
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getLast10RiwayatByUserId = async (req, res) => {
  let response = null;
  try {
    const userId = req.user.id;

    const last10Riwayat = await prisma.riwayat.findMany({
      where: {
        bulan: {
          userId: parseInt(userId),
        },
        deleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      include: {
        kategori: true,
        asalUang: true,
      },
    });

    response = new Response.Success(
      false,
      "Last 10 riwayat retrieved successfully",
      last10Riwayat
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

module.exports = {
  upload: upload.single("file"),
  addRiwayat,
  updateRiwayat,
  deleteRiwayat,

  getRiwayatById,
  getRiwayatByUserId,
  getBulanByBulanAndTahun,
  getRiwayatByDetailBudgetId,
  getRiwayatByUserIdWeekly,
  getLast10RiwayatByUserId,

  deleteNota,
};
