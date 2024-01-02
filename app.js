const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors());

//========= Static Files ====================
app.use('/assets', express.static('assets'));
//===========================================

//++++++++++++++ Routes +++++++++++++++++++++++++++=//
const UserRoutes = require('./Routes/UserRoutes');
const CategoryRoutes = require('./Routes/CatgoryRoutes');
const SpecialtyRoutes = require('./Routes/SpecialtyRoutes');
const PatientActivationRoute = require('./Routes/UserAccountActivicationRoutes');
const ProviderActivationRoute = require('./Routes/ProviderAccountActivicationRoutes');
const ProviderRoutes = require('./Routes/ProviderRoutes');
const RdvTypeRoutes = require('./Routes/Rdv_typeRoutes');
const RdvRoutes = require('./Routes/RdvRoutes');
const DispoRoutes = require('./Routes/DispoRoutes');
//==================================================//



app.use('/users', UserRoutes);
app.use('/providers', ProviderRoutes);
app.use('/categories', CategoryRoutes);
app.use('/specialties', SpecialtyRoutes);
app.use('/patient', PatientActivationRoute);
app.use('/provider', ProviderActivationRoute);
app.use('/rdvtype', RdvTypeRoutes);
app.use('/rdv', RdvRoutes);
app.use('/dispo', DispoRoutes);

app.get('/', (req, res)=>{
    res.send('every thing is okay ... ')
})



app.listen(8000, ()=>{
    console.log('server running on port 8000')
});
