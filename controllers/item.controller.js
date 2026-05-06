const Validator = require("fastest-validator");
const v = new Validator();
const { Item } = require("../models")
const { response } = require("../helpers/response.formatter")
const { Op, or } = require('sequelize');
const fs = require('fs'); // file system, melakukan sesutu yang berhubungan dengan lokasi file
const path = require('path');

module.exports = {
    createItem: async (req, res) => {
        // req : input, 
        // res : output
        try {
            // ambil inputan  (payload) : req.body
            const { name, stock } = req.body; // kalau ada frontend nya nanti req nya dari form ( kalau sekarang dari body )
            // const { image } = req.file;

            // validasi 
            const schema = {
                name: { type: "string", min: 3 },
                stock: { type: "number", positive: true, integer: true }
            }
            // menyiapkan data yang akan divalidasi
            const data = {
                name: name, // fieldDatabase : namaDariReq
                stock: Number(stock) // karena req.body json berupa string , jd stock diubah ke tipe data number pake Number
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                // jika hasil validate ada error
                return res.status(400).json(response(400, "Validasi Error", validate));
            }
            // cek jika image tidak diupload (req.file : mengambil input file )
            if (!req.file) {
                return res.status(400).json(response(400, "Validasi Error", "Image not found"));
            }

            // proses menyimpan data melalui ORM sequelize
            const item = await Item.create({
                name: data.name, // ambil dari object data yang divalidasi sebelumnya
                stock: data.stock,
                image: req.file.filename // ambil filename hasil dari middleware multer
            });
            return res.status(201).json(response(201, "created", item));
        } catch (error) {
            // penanganan err kodingan di try
            // res : parameter func untuk memberikan response (hasil)
            // response : method dari helpers formatter untuk format hasil outputnya, output dalam bentuk json.
            return res.status(500).json(response(500, "Server Error", error.message));
        }

    },
    getItem: async (req, res) => {
        try {
            // req.query : ambil params di postman/ambil data acuan untuk search/sort
            // sortBy : ngurutin berdasarkan field apa
            // order : ASC/DESC, opsi pengurutan
            const { name, sortBy, order } = req.query;
            const items = await Item.findAll({
                where: name ? {
                    name: {
                        [Op.like]: `%${name}%` // mencari yang mirip
                    }
                } : {},
                // kalau di params postman ada sortBy dan order, jalanin pengurutan, kalo gaada pake default. misal sortBy 'stock' order 'DESC'
                order: sortBy && order ? [[sortBy, order]] : [] // cari berdasarkan field name di db dari name req.query
            });

            // PAGINATION 
            const { page, limit } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const { count, rows } = await Item.findAndCountAll({
                offset: Number(offset),
                limit: Number(limit),
                // include: [Item, Return] // mengambil lebih dari satu relasi, dari nama model
            });

            const formatPagination = {
                data: rows, // data yang dimunculkan 
                limit: limit,
                rows: (Number(offset) + 1) + '-' + (Number(offset) + rows.length), // munculkan angka 1-20 atau 21-30 sesuai yang diambil : misal offset 20 : (20+1) (20+10) : 21-30 
                total: count, // jumlah data keseluruhan 
                page: page, // sedang di halaman ke berapa
            }

            const loan = await Loan.findByPk(loan_id);
            // kalau data peminjamam gaada
            if (!loan) {
                return res.status(400).json(response(400, "Validasi Error", "Data loan not found"));
            }
            // data total_item pengembalian (data) tidak boleh kurang dari peminjaman
            if (data.total_item > loan.total_item) {
                return res.status(400).json(response(400, "Validasi Error", "Total return item more than loan item"))
            }
            return res.status(200).json(response(200, "Success", formatPagination));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    showItem: async (req, res) => {
        try {
            // req.params : ambil path dinamis, /items/2. ambil angka 2 (id)
            const { id } = req.params;
            // findByPk : mencari berdasarkan primary key (id)
            const item = await Item.findByPk(id);
            // jika id tidak ada di database
            if (!item) {
                return res.status(400).json(response(400, "Data [id] not found"));
            }
            return res.status(200).json(response(200, "Success", item));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message))
        }
    },
    updateItem: async (req, res) => {
        try {
            const { id } = req.params;
            // ambil inputan  (payload) : req.body
            const { name, stock } = req.body; // kalau ada frontend nya nanti req nya dari form ( kalau sekarang dari body )
            // const { image } = req.file;

            // validasi 
            const schema = {
                name: { type: "string", min: 3 },
                stock: { type: "number", positive: true, integer: true }
            }
            // menyiapkan data yang akan divalidasi
            const data = {
                name: name, // fieldDatabase : namaDariReq
                stock: Number(stock) // karena req.body json berupa string , jd stock diubah ke tipe data number pake Number
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            const item = await Item.findByPk(id); // ambil data sebelumnya
            if (!item) {
                return res.status(400).json(response(400, "Validasi Error", "Data not found"));
            }

            // kalau ada file baru, file lama dihapus
            if (req.file) {
                // karna image uda diganti jadi link di getter model, jadi ambil yang aslinya pake getDataValue
                const imageName = item.getDataValue('image');
                // cari image ke folder uploads
                const filePath = path.join(__dirname, '../uploads', imageName);
                // cek jika file ada di folder tsb
                if (fs.existsSync(filePath)) {
                    // hapus file
                    fs.unlinkSync(filePath);
                }
            }

            // hasil dari update proses hanya true/false bukan data terbaru
            const updateProcess = await Item.update({
                name: data.name,
                stock: data.stock,
                // jika ada file baru, ambil filename baru, jika gaada ambil data asli tanpa link (nama gambar sebelumnya)
                image: (req.file ? req.file.filename : item.getDataValue('image'))
            }, {
                where: { id: id }
            });
            // ambil data baru yang udah di update
            const newItem = await Item.findByPk(id); // untuk dimunculkan
            return res.status(200).json(response(200, 'Success', newItem));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message))
        }
    },
    deleteItem: async (req, res) => {
        try {
            const { id } = req.params;
            // ambil data item untuk diambil gambar dan dihapus
            const item = await Item.findByPk(id);
            const imageName = item.getDataValue('image');
            const filePath = path.join(__dirname, '../uploads', imageName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // delete data di database
            const deleteProcess = await Item.destroy({
                where: { id: id }
            });
            return res.status(200).json(response(200, "deleted"));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
}