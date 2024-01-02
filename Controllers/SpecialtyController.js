const { Sequelize, Specialty, Category } = require('../models');
const { Op } = require('sequelize');

exports.allSpecialties = async (req, res) => {
    try {
        const specialties = await Specialty.findAll({
            attributes:['id','name'],
            include:[
                {
                    model: Category,
                    attributes:['name']
                }
            ]
        });
        res.json({
            success: true,
            data: specialties,
            status: 200
        })
    } catch (error) {
        res.json({
            error: error,
            status: 400,
            message: "error fetcching data "
        })
    }


}

exports.searchSpecialty = async (req, res) => {
    const { specialty } = req.query;
    try {
        const specialtys = await Specialty.findAll({
            where: {
                name: { [Op.like]: `%${specialty}%` }
            }
        });
        res.json({
            success: true,
            data: specialtys,
            status: 200
        })
    } catch (error) {
        res.json({
            success: false,
            errors: error,
            status: 400
        })
    }
}

exports.CreateSpecialty = async (req, res) => {

    const { name, catId } = req.body;
    if (name && catId) {
        const categoryExist = await Category.findByPk(catId)
        if (categoryExist) {
            await Specialty.create({
                name: name,
                categoryId: catId
            })
            res.json({
                message: "Specialty created ... ",
                success: true,
                status: 200
            })
        } else {
            res.json({
                message: "Category not found",
                success: false,
                status: 400
            })
        }

    } else {
        res.json({
            message: "All field are required ...",
            success: false,
            status: 400
        })
    }
}

exports.UpdateSpecialty = async (req, res) => {

    const { id } = req.params;
    const { name, catId } = req.body
    if (Number(id) && Number(catId) && name) {
        const cat = await await Category.findByPk(catId);
        if (cat) {
            const specialty = await Specialty.findByPk(id);
            if (specialty) {
                await specialty.update({
                    name: name,
                    categoryId: catId
                })
                res.json({
                    message: " Specialty Updated ",
                    success: true,
                    status: 200
                })
            } else {
                res.json({
                    message: "No Specialty finded ",
                    success: false,
                    status: 400
                })
            }
        }else {
            res.json({
                message: "Category not found ",
                success: false,
                status: 400
            })
        }

    } else {
        res.json({
            message: "Invalid id  or empty field",
            success: false,
            status: 400
        })
    }
}

exports.deleteSpecialty = async (req, res) => {
    const { id } = req.params;
    if (Number(id)) {
        const specialty = await Specialty.findByPk(id);
        if (specialty) {
            await specialty.destroy();
            res.json({
                message: "Specialty deleted ",
                success: true,
                status: 200
            })
        } else {
            res.json({
                message: "No Specialty finded ",
                success: false,
                status: 400
            })
        }
    } else {
        res.json({
            message: "Invalid id  ",
            success: false,
            status: 400
        })
    }

}

exports.specialtiesOfCat = async(req,res) =>{
    const {catId} = req.query
    const specialties = await Specialty.findAll({
        include:[
            {
                model: Category,
                where:{id: catId}
            }
        ]
    });
    res.json({
        data:specialties
    })
}