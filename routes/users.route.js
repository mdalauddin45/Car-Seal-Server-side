const express = require('express');
const { getAllUsers } = require('../controllers/userocntroller/users.Controller');

const router = express.Router();

router.get('/', getAllUsers);

router.get('/:email', (req, res) => {
    res.send('get single user');
});


router.put("/:email", (req, res) => {
    res.send("put user");
});

router.delete("/:id", (req, res) => {
    res.send("delete user id");
});


module.exports = router;