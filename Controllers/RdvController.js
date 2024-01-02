const { Sequelize, Rdv, Rdv_motif, provider, User } = require('../models');

exports.allRdvs = async (req, res) => {

    const rdvs = await Rdv.findAll({
        attributes: ['id', 'status', 'patientName', 'createdAt'],
        include: [

            {
                model: Rdv_motif,
                attributes: ['name'], // specify the fields you want to include from RdvType
            },
            {
                model: provider,
                attributes: ['cabinName'],
            }, {
                model: User,
                attributes: ['firstName', 'lastName'],
            }
        ],
    });
    res.json({
        success: true,
        data: rdvs,
        status: 200
    });
}


exports.CreateRdv = async (req, res) => {
    const { patientName, type } = req.body;
    const { userId, providerId } = req.params;

    if (patientName && Number(type) && Number(userId) && Number(providerId)) {
        const userExist = await User.findByPk(userId);
        const providerExist = await provider.findByPk(providerId);
        const typeExist = await Rdv_motif.findByPk(type);
        if (userExist && providerExist && typeExist) {
            // res.json({userExist,providerExist,typeExist});
            await Rdv.create({
                patientName: patientName,
                userId: userExist.id,
                RdvTypeId: type,
                providerId: providerId
            })
            res.json({
                message: "Rdv created ... ",
                success: true,
                status: 200
            })

        } else {
            res.json({
                success: false,
                status: 400
            })
        }

    } else {
        res.json({
            message: "All field are required ...",
            success: false,
            status: 200
        })
    }
}

exports.confirmRdv = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        const myRdv = await Rdv.findByPk(id);
        if (myRdv) {
            await myRdv.update({
                status: 'confirmed'
            });
            res.json({
                message: 'rdv confirmed',
                success: true,
                status: 200
            })
        }else{
            res.json({
                message: 'Rdv not found',
                success: false,
                status: 400
            })
        }

    } else {
        res.json({
            message: 'invalid Id',
            success: false,
            status: 400
        })
    }
}

exports.cancelRdv = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        const myRdv = await Rdv.findByPk(id);
        if (myRdv) {
            await myRdv.update({
                status: 'canceled'
            });
            res.json({
                message: 'rdv canceled',
                success: true,
                status: 200
            })
        }else{
            res.json({
                message: 'Rdv not found',
                success: false,
                status: 400
            })
        }

    } else {
        res.json({
            message: 'invalid Id',
            success: false,
            status: 400
        })
    }
}

exports.closeRdv = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        const myRdv = await Rdv.findByPk(id);
        if (myRdv) {
            await myRdv.update({
                status: 'closed'
            });
            res.json({
                message: 'rdv closed',
                success: true,
                status: 200
            })
        }else{
            res.json({
                message: 'Rdv not found',
                success: false,
                status: 400
            })
        }

    } else {
        res.json({
            message: 'invalid Id',
            success: false,
            status: 400
        })
    }
}

exports.deleteRdv = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        const myRdv = await Rdv.findByPk(id);
        if (myRdv) {
            await myRdv.destroy();
            res.json({
                message: 'rdv deleted',
                success: true,
                status: 200
            })
        }else{
            res.json({
                message: 'Rdv not found',
                success: false,
                status: 400
            })
        }

    } else {
        res.json({
            message: 'invalid Id',
            success: false,
            status: 400
        })
    }
}