var express = require('express');
var router = express.Router();
let slugify = require('slugify');
let { dataCategories, dataProducts } = require('../utils/data')
let { GenID, getItemById } = require('../utils/idHandler')

/* GET users listing. */
router.get('/', function (req, res, next) {
    let result = dataProducts.filter(
        function (e) {
            return !e.isDeleted;
        }
    )
    res.send(result);
});
router.get('/:id', function (req, res, next) {
    let id = req.params.id;
    let result = dataProducts.filter(
        function (e) {
            return e.id == id && !e.isDeleted;
        }
    )
    if (result.length) {
        res.send(result[0])
    } else {
        res.status(404).send({
            message: "ID NOT FOUND"
        })
    }
});

router.post('/', function (req, res) {
    let getCate = getItemById(req.body.category,
        dataCategories
    );
    if (!getCate) {
        res.status(404).send({
            message: "ID CATE NOT FOUND"
        })
        return
    }
    let newProduct = {
        id: GenID(dataProducts),
        title: req.body.name,
        slug: slugify(req.body.title, {
            replacement: '-',
            remove: undefined,
            lower: true,
            strict: true
        }),
        price: req.body.price,
        description: req.body.description,
        images: req.body.images,
        category: getCate,
        creationAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
    }
    dataProducts.push(newProduct);
    res.send(newProduct)
})
router.put('/:id', function (req, res) {
    let id = req.params.id;
    let result = dataProducts.filter(
        function (e) {
            return e.id == id && !e.isDeleted;
        }
    )
    if (result.length) {
        result = result[0];
        let keys = Object.keys(req.body);
        for (const key of keys) {
            if (result[key]) {
                result[key] = req.body[key]
            }
        }
        result.updatedAt = new Date(Date.now())
        res.send(result)
    } else {
        res.status(404).send({
            message: "ID NOT FOUND"
        })
    }
})
router.delete('/:id', function (req, res) {
    let id = req.params.id;
    let result = dataProducts.filter(
        function (e) {
            return e.id == id && !e.isDeleted;
        }
    )
    if (result.length) {
        result = result[0];
        result.isDeleted = true;
        result.updatedAt = new Date(Date.now())
        res.send(result)
    } else {
        res.status(404).send({
            message: "ID NOT FOUND"
        })
    }
})

module.exports = router;
