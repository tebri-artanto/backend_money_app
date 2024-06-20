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

const uploadNotaTest = async (req, res) => {
  try {
    const { originalname, buffer, mimetype } = req.file;

    const generateRandomName = () => {
      const characters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randomName = "";
      for (let i = 0; i < 10; i++) {
        randomName += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return randomName;
    };
    const imageName = `${generateRandomName()}_${Date.now()}.${originalname
      .split(".")
      .pop()}`;
    console.log(imageName);
    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: buffer,
      ContentType: mimetype,
    };

    const upload = await s3Client.send(new PutObjectCommand(params));
    console.log(upload);

    const newNota = await prisma.nota.create({
      data: {
        imagePath: imageName,
      },
    });

    console.log(newNota);
    notaId = newNota.id;

    res.status(200).json({ message: "Image uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const uploadNota = async (originalname, buffer, mimetype) => {
  try {
    const generateRandomName = () => {
      const characters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randomName = "";
      for (let i = 0; i < 10; i++) {
        randomName += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return randomName;
    };
    const imageName = `${generateRandomName()}_${Date.now()}.${originalname
      .split(".")
      .pop()}`;
    console.log(imageName);
    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: buffer,
      ContentType: mimetype,
    };

    const upload = await s3Client.send(new PutObjectCommand(params));
    console.log(upload);

    const newNota = await prisma.nota.create({
      data: {
        imagePath: imageName,
      },
    });

    console.log(newNota);
    return newNota.id;
  } catch (error) {
    console.error(error);
    throw new Error("Internal server error");
  }
};

const addDetailRiwayatTest = async (
  namaBarang,
  jumlah,
  harga,
  total,
  idRiwayat
) => {
  let response = null;
  try {
    const addDetailRiwayat = await prisma.detailRiwayat.create({
      data: {
        namaBarang,
        jumlah: parseInt(jumlah),
        harga: parseFloat(harga),
        total: parseFloat(total),
        riwayatId: parseInt(idRiwayat),
      },
    });

    response = new Response.Success(
      false,
      "Detail Riwayat added successfully",
      addDetailRiwayat
    );
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.log(error);
  }
};

const addDetailRiwayat = async (req, res) => {
  let response = null;
  try {
    const { detailBarang, idRiwayat } = req.body;

    // Validate the input data
    if (!Array.isArray(detailBarang) || !idRiwayat) {
      response = new Response.Error(true, "Invalid request data");
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const detailRiwayatData = await Promise.all(
      detailBarang.map(async (item) => {
        const { namaBarang, jumlah, total } = item;
        const addDetailRiwayat = await prisma.detailRiwayat.create({
          data: {
            namaBarang,
            jumlah: parseFloat(jumlah), // Convert jumlah to a float
            total: parseFloat(total), // Convert total to a float
            riwayatId: parseInt(idRiwayat),
          },
        });
        return addDetailRiwayat;
      })
    );

    response = new Response.Success(
      false,
      "Detail Riwayat added successfully",
      detailRiwayatData
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const addRiwayat = async (req, res) => {
  let response = null;
  try {
    const { tanggal, tipe, nominal, catatan, asalUangId, kategoriId, userId } =
      req.body;
    // const tanggal = '2024-05-29' ;
    // const tipe = 'Pemasukan' ;
    // const nominal = '100000' ;
    // const catatan = 'test' ;
    // const asalUangId = '1' ;
    // const kategoriId = '1' ;
    // const userId = '1' ;

    const { originalname, buffer, mimetype } = req.file || {};
    console.log(Date(tanggal));
    const findBulan = {
      bln: new Date(tanggal).getMonth() + 1,
      tahun: new Date(tanggal).getFullYear(),
    };
    let newBulan = null;
    let bulanId = null;

    if (tipe === "Pemasukan") {
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
    } else if (tipe === "Pengeluaran") {
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

    if (req.file) {
      console.log("masuk sini 1");
      const generateRandomName = () => {
        const characters =
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomName = "";
        for (let i = 0; i < 10; i++) {
          randomName += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return randomName;
      };
      const imageName = `${generateRandomName()}_${Date.now()}.${originalname
        .split(".")
        .pop()}`;
      console.log(imageName);
      const params = {
        Bucket: bucketName,
        Key: imageName,
        Body: buffer,
        ContentType: mimetype,
      };

      const upload = await s3Client.send(new PutObjectCommand(params));
      console.log(upload);

      const newNota = await prisma.nota.create({
        data: {
          imagePath: imageName,
        },
      });

      const riwayat = await prisma.riwayat.create({
        data: {
          tanggal: isoTanggal,
          tipe,
          nominal: parseFloat(nominal),
          catatan,
          asalUangId: parseInt(asalUangId),
          kategoriId: parseInt(kategoriId),
          bulanId: parseInt(bulanId),
          notaId: parseInt(newNota.id),
        },
      });
      // addDetailRiwayatTest(namaBarang, jumlah, harga, total, riwayat.id);
      response = new Response.Success(
        false,
        "Riwayat added successfully",
        riwayat
      );
      res.status(httpStatus.OK).json(response);
    } else {
      console.log("masuk sini");
      const riwayat = await prisma.riwayat.create({
        data: {
          tanggal: isoTanggal,
          tipe,
          nominal: parseFloat(nominal),
          catatan,
          asalUangId: parseInt(asalUangId),
          kategoriId: parseInt(kategoriId),
          bulanId: parseInt(bulanId),
        },
      });
      // addDetailRiwayatTest(namaBarang, jumlah, harga, total, riwayat.id);
      response = new Response.Success(
        false,
        "Riwayat added successfully",
        riwayat
      );
      res.status(httpStatus.OK).json(response);
    }
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const updateRiwayat = async (req, res) => {
  let response = null;
  try {
    const id = req.params.id;
    console.log(id)
    const { tanggal, tipe, nominal, catatan, asalUangId, kategoriId, bulanId } =
      req.body;
    const { originalname, buffer, mimetype } = req.file || {};

    console.log(req.file);
    console.log(req.body);

    const existingRiwayat = await prisma.riwayat.findUnique({
      where: { id: Number(id) },
      include: {
        nota: true,
      },
    });

    if (!existingRiwayat) {
      response = new Response.Error(true, "Riwayat not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    let notaId = existingRiwayat.notaId;

    if (req.file) {
      // Delete the existing image from S3 if there is one
      if (existingRiwayat.nota) {
        const params = {
          Bucket: bucketName,
          Key: existingRiwayat.nota.imagePath,
        };
        await s3Client.send(new DeleteObjectCommand(params));
        await prisma.nota.delete({ where: { id: existingRiwayat.notaId } });
      }

      // Upload the new image to S3
      const generateRandomName = () => {
        const characters =
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomName = "";
        for (let i = 0; i < 10; i++) {
          randomName += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return randomName;
      };
      const imageName = `${generateRandomName()}_${Date.now()}.${originalname
        .split(".")
        .pop()}`;
      const params = {
        Bucket: bucketName,
        Key: imageName,
        Body: buffer,
        ContentType: mimetype,
      };
      const upload = await s3Client.send(new PutObjectCommand(params));
      const newNota = await prisma.nota.create({
        data: { imagePath: imageName },
      });
      notaId = newNota.id;
    }

    const date = new Date(tanggal);

    const isoTanggal = date.toISOString();

    const updatedRiwayat = await prisma.riwayat.update({
      where: { id: Number(id) },
      data: {
        tanggal : isoTanggal,
        tipe,
        nominal: parseFloat(nominal),
        catatan,
        asalUangId: parseInt(asalUangId),
        kategoriId: parseInt(kategoriId),
        bulanId: parseInt(bulanId),
        notaId,
      },
    });

    response = new Response.Success(
      false,
      "Riwayat updated successfully",
      updatedRiwayat
    );
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
        nota: true,
      },
    });

    if (!riwayat) {
      response = new Response.Error(true, "Riwayat not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    const { tipe, nominal, bulanId, notaId } = riwayat;

    // Update the bulan data
    if (tipe === "Pemasukan") {
      const updatedBulan = await prisma.bulan.update({
        where: { id: bulanId },
        data: {
          pemasukan: { decrement: parseFloat(nominal) },
          total: { decrement: parseFloat(nominal) },
        },
      });
    } else if (tipe === "Pengeluaran") {
      const updatedBulan = await prisma.bulan.update({
        where: { id: bulanId },
        data: {
          pengeluaran: { decrement: parseFloat(nominal) },
          total: { increment: parseFloat(nominal) },
        },
      });
    }

    // Delete the image from S3 if there is one
    if (riwayat.nota) {
      const params = {
        Bucket: bucketName,
        Key: riwayat.nota.imagePath,
      };
      await s3Client.send(new DeleteObjectCommand(params));
      await prisma.nota.delete({ where: { id: notaId } });
    }

    // Delete the riwayat
    await prisma.riwayat.delete({ where: { id: Number(id) } });

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
      where: { id: Number(id) },
      include: {
        asalUang: true,
        kategori: true,
        nota: {
          select: {
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

const getRiwayatByBulanId = async (req, res) => {
  let response = null;
  try {
    const bulanId = req.params.id;
    console.log(bulanId);
    const riwayat = await prisma.riwayat.findMany({
      where: { bulanId: Number(bulanId) },
      include: {
        asalUang: true,
        kategori: true,
        nota: true,
        bulan: true,
      },
    });

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

module.exports = {
  upload: upload.single("file"),
  uploadNota,
  addRiwayat,
  updateRiwayat,
  deleteRiwayat,
  getRiwayatById,
  getRiwayatByBulanId,
  getRiwayatByUserId,
  getBulanByBulanAndTahun,
  addDetailRiwayat,
  uploadNotaTest,

  deleteNota,
};
