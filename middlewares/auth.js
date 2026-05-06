const jwt = require('jsonwebtoken')
const { response } = require("../helpers/response.formatter")
const { auth_secret } = require('../config/base.config')

module.exports = {
    // next : parameter, untuk melanjutkan req. kalo uda di cek middlewarenya melanjutkan ke controller pake next
    checkToken: async (req, res, next) => {
        // token diambil dari header
        const token = req.header("Authorization");
        if (!token) {
            // 401 : err untuk pengguna yang belum login (unauthorized)
            return res.status(401).json(response(401, "Unauthorized", "Please login and try again!"));
        }

        try {
            // cek token aktif atau engga (belum expired)
            const check = jwt.verify(token, auth_secret);

            // karena nanti pengguna perlu data identitas pengguna (userId atau yang lain), panggil payload yg dikirim jwt.sign() di loginController dan disimpan di req. data payload tersimpan di const check (hasil verify), ada {userId, name, email}
            req.userId = check.userId;
            next(); // lanjutkan proses routing yang diminta
        } catch (error) {
            // jika terjadi error, ini hubungannya dengan token. jadi kasi 401 (suruh login lagi)
            return res.status(401).json(response(401, "Unauthorized", "Please login and try again!"));
        }
    }
}