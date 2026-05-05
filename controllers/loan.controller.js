const Validator = require("fastest-validator");
const v = new Validator();
const { Item, Loan } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");

module.exports = {
    createLoan: async (req, res) => {
        try {
            const { item_id, name, total_item, date } = req.body;

            const schema = {
                item_id: { type: "number", positive: true, integer: true },
                total_item: { type: "number", positive: true, integer: true },
                name: { type: "string", min: 3 },
                date: { type: "date" }
            }

            const data = {
                item_id: Number(item_id), // string menjadi number 
                total_item: Number(total_item),
                name: name,
                date: new Date(date) //string menjad date

            }
            const validate = v.validate(data, schema);
            // cek validasi 
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'validasi gagal', validate));
            }

            const item = await Item.findByPk(item_id);
            if (!item) {
                return res.status(404).json(response(404, 'data item not found please check [item_id]'))
            }
            // memastikan data total item yang dipinja kurang dari stock gaboleh pinjem lebih dari stock yang ada 
            if (data.total_item > item.stock) {
                return res.status(400).json(response(400, `stock not available available only ${item.stock}`))
            }



        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error))
        }
    }
}