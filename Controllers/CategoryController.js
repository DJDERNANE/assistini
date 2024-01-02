const {Sequelize, Category} = require('../models');
const {Op} = require('sequelize');

exports.allCategories = async (req, res) => {
    const cats = await Category.findAll();
    res.json({
        success: true,
        data: cats,
        status: 200
    });
}

exports.searchCategory = async (req, res)=>{
    const {cat} = req.query;
    try {
        const cats = await Category.findAll({
            where:{
                name: {[Op.like] : `%${cat}%`}
            }
        });
        res.json({
            success: true,
            data: cats,
            status: 200
        })
    } catch (error) {
        req.json({
            success: false,
            errors: error,
            status: 400
        })
    }
}

exports.CreateCategory = async (req,res)=>{
    const {Cat_name} = req.body;
    if (Cat_name) {
        const new_category = await Category.create({
            name : Cat_name
        })
        res.json({
            message: "Category created ... ",
            success: true,
            status: 200
        })
    }else{
        res.json({
            message: "All field are required ...",
            success: false,
            status: 400
        })
    }
} 

exports.UpdateCategory = async (req, res)=>{
    const {id} = req.params;    
    const {Cat_name}= req.body
    if (Number(id) && Cat_name) {
        const cat = await Category.findByPk(id);
        if (cat) {
            await cat.update({
                name: Cat_name
            })
            res.json({
                message: " Category Updated ",
                success: true,
                status: 200
            })
        } else{
            res.json({
                message: "No Category finded ",
                success: false,
                status: 400
            })
        }  
    }else{
        res.json({
            message: "Invalid id  or empty field",
            success: false,
            status: 400
        })
    }
}

exports.deleteCategory = async (req, res)=>{
    const {id} = req.params;
    
    if (Number(id)) {
        const cat = await Category.findByPk(id);
        if (cat) {
            const deleted_cat = await cat.destroy();
            res.json({
                message: "Category deleted ",
                success: true,
                status: 200
            })
        } else{
            res.json({
                message: "No Category finded ",
                success: false,
                status: 400
            })
        }  
    }else{
        res.json({
            message: "Invalid id  ",
            success: false,
            status: 400
        })
    }
    
}