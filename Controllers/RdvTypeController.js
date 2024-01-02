const {Sequelize, Rdv_type} = require('../models');
const {Op} = require('sequelize');

exports.allTypes = async (req, res) => {
    const types = await Rdv_type.findAll();
    res.json({
        success: true,
        data: types,
        status: 200
    });
}


exports.CreateType = async (req,res)=>{
    const {name} = req.body;
    if (name) {
        const new_Type = await Rdv_type.create({
            name : name
        })
        res.json({
            message: "Type created ... ",
            success: true,
            status: 200
        })
    }else{
        res.json({
            message: "All field are required ...",
            success: false,
            status: 200
        })
    }
} 


exports.UpdateType = async (req, res)=>{
      const {id}= req.params;
    const {name}= req.body
    if (Number(id) && name) {
        const Type = await Rdv_type.findByPk(id);
        if (Type) {
            await Type.update({
                name: name
            })
            res.json({
                message: " Type Updated ",
                success: true,
                status: 200
            })
        } else{
            res.json({
                message: "No Type finded ",
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

exports.deleteType = async (req, res)=>{
    const {id} = req.params;
    
    if (Number(id)) {
        const Type = await Rdv_type.findByPk(id);
        if (Type) {
            const deleted_Type = await Type.destroy();
            res.json({
                message: "Type deleted ",
                success: true,
                status: 200
            })
        } else{
            res.json({
                message: "No Type finded ",
                success: false,
                status: 200
            })
        }  
    }else{
        res.json({
            message: "Invalid id  ",
            success: false,
            status: 200
        })
    }
    
}