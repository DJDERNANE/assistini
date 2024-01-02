

const express = require('express');
const router = express.Router();
const {CreateCategory, allCategories, deleteCategory, UpdateCategory, searchCategory} = require('../Controllers/CategoryController');

router.get('/', allCategories);

router.get('/search', searchCategory);

router.post('/', CreateCategory);

router.delete('/:id', deleteCategory);

router.put('/:id', UpdateCategory);


module.exports = router