var express = require('express');
var router = express.Router();
let slugify = require('slugify');
let { dataCategories, dataProducts } = require('../utils/data')
let { GenID } = require('../utils/idHandler')

/* GET users listing. */
router.get('/', function (req, res, next) {
  let result = dataCategories.filter(
    function (e) {
      return !e.isDeleted;
    }
  )
  res.send(result);
});
router.get('/:id', function (req, res, next) {
  let id = req.params.id;
  let result = dataCategories.filter(
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
router.get('/:id/products', function (req, res, next) {
  let id = req.params.id;
  let result = dataCategories.filter(
    function (e) {
      return e.id == id && !e.isDeleted;
    }
  )
  if (result.length) {
    result = dataProducts.filter(
      function (e) {
        return e.category.id == id
      }
    )
    res.send(result)
  } else {
    res.status(404).send({
      message: "ID NOT FOUND"
    })
  }
});
//CREATE UPDATE DELETE
router.post('/', function (req, res) {
  let newCate = {
    id: GenID(dataCategories),
    name: req.body.name,
    slug: slugify(req.body.name, {
      replacement: '-',
      remove: undefined,
      lower: true,
      strict: true
    }),
    image: req.body.image,
    creationAt: new Date(Date.now()),
    updatedAt: new Date(Date.now()),
  }
  dataCategories.push(newCate);
  res.send(newCate)
})
router.put('/:id', function (req, res) {
  let id = req.params.id;
  let result = dataCategories.filter(
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
  let result = dataCategories.filter(
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
