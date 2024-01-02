const { Sequelize, provider, Specialty, ProviderSpecialty,disponibilty, Category } = require('../models');
const {Op} = require('sequelize');


const bcrypt = require('bcrypt');
const saltRound = 10;
var jwt = require('jsonwebtoken');
var { main } = require('../Componenets/MailComponent')


exports.allProviders = async (req, res) => {
    const providers = await provider.findAll(
        {
            include: [
                {
                    model: Specialty,
                    attributes: ['name'],
                    through: { model: ProviderSpecialty, attributes: ['name'] },
                    as: 'Specialties'
                }
            ]
        }
    );
    res.json({
        success: true,
        data: providers,
        status: 200
    });
}

exports.showProvider = async (req, res) => {
    const { id } = req.params;
    if (Number(id)) {
        const current_provider = await provider.findByPk(id, {
            include :  disponibilty,
                   
        });
        if (current_provider === null) {
            res.json({
                success: false,
                message: 'provider not found',
                status: 400
            })

        } else {
            res.json({
                success: true,
                data: current_provider,
                status: 200
            })
        }
    } else {
        res.json({
            success: false,
            message: 'invalid id',
            status: 400
        })
    }
}

exports.SignUp = async (req, res) => {
    var specialties = [];
    const { fullName, email, password, phone, cabinName, address, localisation, desc, speIds } = req.body;
    if (fullName && cabinName && email && password && phone && address && localisation && desc) {
        speIds.forEach(async (speId) => {
            var specialtyExist = await Specialty.findOne({ where: { id: speId } })
            specialtyExist ? specialties = [...specialties, specialtyExist] : ''
        });
        bcrypt.hash(password, saltRound, async (err, hash) => {
            if (!err) {
                try {
                    const newprovider = await provider.create({
                        fullName: fullName,
                        cabinName: cabinName,
                        email: email,
                        password: hash,
                        phone: phone,
                        localisation: localisation,
                        desc: desc,
                        address: address
                    });
                    await newprovider.setSpecialties(specialties, { through: { name: newprovider.cabinName } });
                    const token = jwt.sign({ email: email }, 'secret', { expiresIn: '24h' });
                    //send mail verification link 
                    main(email, token, 'provider').catch(console.error);
                    res.json({
                        message: "Provider Created, Check your email ",
                        success: true,
                        status: 200,
                    })
                } catch (error) {
                    console.log(error)
                    res.json({
                        message: "Provider not created there is an error :  ",
                        success: false,
                        status: 400
                    })
                }
            } else {
                res.json({
                    message: "Hashing error : ", err,
                    success: false,
                    status: 400
                })
            }

        })



    } else {
        res.json({
            message: "Invalid Field",
            success: false,
            status: 400
        })
    }
};

exports.Login = async (req, res) => {
    const { email, password } = req.body
    if (email && password) {
        const current_provider = await provider.findOne({ where: { email: email } });
        if (current_provider === null) {
            res.json({
                message: "This Email doesn't exist",
                success: false,
                status: 400
            })
        } else {
            bcrypt.compare(password, current_provider.password, (err, result) => {
                if (result) {
                    const token = jwt.sign({ email: email, id: current_provider.id }, 'secret', { expiresIn: '24h' });
                    res.json({
                        message: "loged In ",
                        success: true,
                        status: 200,
                        token: token
                    })
                } else {
                    res.json({
                        message: "Wrong password  ",
                        success: false,
                        status: 400
                    })
                }
            })
        }
    }
}
exports.updateProvider = async (req, res) => {
    const { id } = req.params;
    if (Number(id)) {
        const current_provider = await provider.findByPk(id);
        if (current_provider) {
            const { fullName, email, phone, cabinName, address, localisation, desc, speId } = req.body;
            if (fullName && cabinName && email && phone && address && localisation && desc && speId) {
                const specialtyExist = await Specialty.findByPk(speId);
                if (specialtyExist) {
                    await current_provider.update({
                        fullName: fullName,
                        cabinName: cabinName,
                        email: email,
                        phone: phone,
                        address: address,
                        localisation: localisation,
                        desc: desc
                    })
                    res.json({
                        success: true,
                        message: "privider info updated",
                        status: 200
                    })
                } else {
                    res.json({
                        success: false,
                        message: "all fields is required",
                        status: 400
                    })
                }
            } else {
                res.json({
                    success: false,
                    message: "all field are required",
                    status: 400
                })
            }


        } else {
            res.json({
                success: false,
                message: "provider not found",
                status: 400
            })
        }

    } else {
        res.json({
            success: false,
            message: "invalid Id ",
            status: 400
        })
    }
}

exports.searchProvider = async (req, res) =>{
    const {specialty, category , location} = req.query;
    
    try {
        const { count, rows } = await provider.findAndCountAll({
            where: {
                address: { [Op.like]: `%${location}%` },
            },
            include: [
                {
                    model: Specialty,
                    attributes: ['name'],

                    where:{
                        id:  { [Op.eq]: specialty },
                    },
                    through: { model: ProviderSpecialty, attributes: ['name'] },
                    as: 'Specialties',
                
         
                    include: [
                        {
                            model: Category,
                            attributes: ['name'], 
                            where:{
                                id: { [Op.eq]: category },
                            } 
                        },
                    ],
               },
            ],
        });
        res.json({
            success: true,
            data: rows,
            total: count,
            status: 200,
        });
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            errors: error,
            status: 400,
        });
    }
}
