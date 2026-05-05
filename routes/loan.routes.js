const express = require('express')
const router = express.Router();

const upload = require('../middlewares/upload');
const loanController = require('../controllers/loan.controller');

//  karena post dan put/patch sudah terikat dengan middleware upload
//  jadi tidak ada gambar upload diposr ditambahkan tapi kosong : none()

router.post('/', upload.none(), loanController.createLoan)
router.get('/', loanController.getLoans)

module.exports = router