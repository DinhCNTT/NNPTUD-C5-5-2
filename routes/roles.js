var express = require('express');
var router = express.Router();
let { dataRole, dataUser } = require('../utils/data');

// GET /api/v1/roles - Lấy tất cả roles
router.get('/', function (req, res) {
    res.send(dataRole);
});

// GET /api/v1/roles/:id - Lấy role theo id
router.get('/:id', function (req, res) {
    let id = req.params.id;
    let role = dataRole.find(function (r) {
        return r.id === id;
    });
    if (role) {
        res.send(role);
    } else {
        res.status(404).send({ message: 'ROLE NOT FOUND' });
    }
});

// GET /api/v1/roles/:id/users - Lấy tất cả users trong role
router.get('/:id/users', function (req, res) {
    let id = req.params.id;
    let role = dataRole.find(function (r) {
        return r.id === id;
    });
    if (!role) {
        return res.status(404).send({ message: 'ROLE NOT FOUND' });
    }
    let users = dataUser.filter(function (u) {
        return u.role.id === id;
    });
    res.send(users);
});

// POST /api/v1/roles - Tạo role mới
router.post('/', function (req, res) {
    let { name, description } = req.body;
    if (!name) {
        return res.status(400).send({ message: 'name là bắt buộc' });
    }
    let newRole = {
        id: 'r' + (dataRole.length + 1 + Date.now()),
        name: name,
        description: description || '',
        creationAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    dataRole.push(newRole);
    res.status(201).send(newRole);
});

// PUT /api/v1/roles/:id - Cập nhật role
router.put('/:id', function (req, res) {
    let id = req.params.id;
    let role = dataRole.find(function (r) {
        return r.id === id;
    });
    if (!role) {
        return res.status(404).send({ message: 'ROLE NOT FOUND' });
    }
    let keys = Object.keys(req.body);
    for (const key of keys) {
        if (key !== 'id' && key !== 'creationAt' && role[key] !== undefined) {
            role[key] = req.body[key];
        }
    }
    role.updatedAt = new Date().toISOString();
    // Cập nhật thông tin role trong tất cả users thuộc role này
    dataUser.forEach(function (u) {
        if (u.role.id === id) {
            u.role.name = role.name;
            u.role.description = role.description;
        }
    });
    res.send(role);
});

// DELETE /api/v1/roles/:id - Xóa role
router.delete('/:id', function (req, res) {
    let id = req.params.id;
    let index = dataRole.findIndex(function (r) {
        return r.id === id;
    });
    if (index === -1) {
        return res.status(404).send({ message: 'ROLE NOT FOUND' });
    }
    let deleted = dataRole.splice(index, 1)[0];
    res.send(deleted);
});

module.exports = router;
