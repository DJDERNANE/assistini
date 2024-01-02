const {disponibilty, provider} = require('../models');



exports.ProviderDisponibilties = async (req,res) =>{
    const {id} = req.params;
    if (Number(id)) {
        const dispo = await disponibilty.findAll({
            attributes: ['day', 'startTime' , 'endTime'],
            include:[
                {
                    model: provider,
                    attributes: ['fullName', 'cabinName'],
                    where:{
                        id: id
                    }
                    
                }
            ]
        }) ;
        res.json({
            success: true,
            data: dispo,
            status: 200
        })
    }

}