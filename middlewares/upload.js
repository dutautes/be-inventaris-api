const multer = require("multer")
// path : agar bisa mengakses folder file project
const path = require("path")

// proses uplad multer disimpan di middleware karena :
// middleware : penghubung (route- middleware - controller)
// sblm file di akses controller, oleh middleware diproses dulu agar siap digunakan

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // file yang diupload akan disimpan di folder project ini bagian uploads
        cb(null, path.join(__dirname, "../uploads")) // path.join : untuk gabungin path yang sesuai dengan OS
        // __dirname : untuk path projeknya
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // ngmabil .jpg/.png dar nama asli file
        const ext = path.extname(file.originalname)
        // uniqueSuffix isinya  nama file random, ext isinya .jpg jadi perlu digabung
        const name = file.fieldname + '-' + uniqueSuffix + ext;
        cb(null, name)
    }
})

module.exports = multer({ storage: storage })