var express = require('express');
var router = express.Router();
let { dataUser, dataRole } = require('../utils/data');

// GET /api/v1/useraccounts - Lấy tất cả users
router.get('/', function (req, res) {
    res.send(dataUser);
});

// GET /api/v1/useraccounts/:username - Lấy user theo username
router.get('/:username', function (req, res) {
    let username = req.params.username;
    let user = dataUser.find(function (u) {
        return u.username === username;
    });
    if (user) {
        res.send(user);
    } else {
        res.status(404).send({ message: 'USER NOT FOUND' });
    }
});

// POST /api/v1/useraccounts - Tạo user mới
router.post('/', function (req, res) {
    let { username, password, email, fullName, avatarUrl, status, roleId } = req.body;
    if (!username || !password || !email) {
        return res.status(400).send({ message: 'username, password và email là bắt buộc' });
    }
    // Kiểm tra username đã tồn tại chưa
    let exists = dataUser.find(function (u) {
        return u.username === username;
    });
    if (exists) {
        return res.status(409).send({ message: 'USERNAME ĐÃ TỒN TẠI' });
    }
    // Tìm role
    let role = null;
    if (roleId) {
        role = dataRole.find(function (r) {
            return r.id === roleId;
        });
        if (!role) {
            return res.status(404).send({ message: 'ROLE NOT FOUND' });
        }
    } else {
        // Mặc định role r3 - Người dùng
        role = dataRole.find(function (r) { return r.id === 'r3'; });
    }
    let newUser = {
        username: username,
        password: password,
        email: email,
        fullName: fullName || '',
        avatarUrl: avatarUrl || '',
        status: status !== undefined ? status : true,
        loginCount: 0,
        role: {
            id: role.id,
            name: role.name,
            description: role.description
        },
        creationAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    dataUser.push(newUser);
    res.status(201).send(newUser);
});

// PUT /api/v1/useraccounts/:username - Cập nhật user
router.put('/:username', function (req, res) {
    let username = req.params.username;
    let user = dataUser.find(function (u) {
        return u.username === username;
    });
    if (!user) {
        return res.status(404).send({ message: 'USER NOT FOUND' });
    }
    // Nếu có cập nhật role
    if (req.body.roleId) {
        let role = dataRole.find(function (r) {
            return r.id === req.body.roleId;
        });
        if (!role) {
            return res.status(404).send({ message: 'ROLE NOT FOUND' });
        }
        user.role = {
            id: role.id,
            name: role.name,
            description: role.description
        };
    }
    // Cập nhật các trường khác (bỏ qua username, roleId, creationAt)
    let allowedKeys = ['password', 'email', 'fullName', 'avatarUrl', 'status', 'loginCount'];
    for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
            user[key] = req.body[key];
        }
    }
    user.updatedAt = new Date().toISOString();
    res.send(user);
});

// DELETE /api/v1/useraccounts/:username - Xóa user
router.delete('/:username', function (req, res) {
    let username = req.params.username;
    let index = dataUser.findIndex(function (u) {
        return u.username === username;
    });
    if (index === -1) {
        return res.status(404).send({ message: 'USER NOT FOUND' });
    }
    let deleted = dataUser.splice(index, 1)[0];
    res.send(deleted);
});

module.exports = router;
