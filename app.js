require('dotenv').config();
const db = require('./config/config');
const express = require('express');
const app = express();
const cron = require('node-cron');


// socket 
var server = require('http').createServer(app)
var io = require('socket.io')(server, {
    cors: {
        origin: '*',
        method: ["GET", "POST"]
    }
})



//const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');



app.use(express.static('assets'));
//app.use(bodyParser.urlencoded({ extended: true }));

//app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
//++++++++++++++ Routes +++++++++++++++++++++++++++=//
const UserRoutes = require('./Routes/UserRoutes');
const CategoryRoutes = require('./Routes/CategoryRoutes');
const SpecialtyRoutes = require('./Routes/SpecialtyRoutes');
const PatientActivationRoute = require('./Routes/UserAccountActivicationRoutes');
const ProviderActivationRoute = require('./Routes/ProviderAccountActivicationRoutes');
const ProviderRoutes = require('./Routes/ProviderRoutes');
const RdvTypeRoutes = require('./Routes/Rdv_typeRoutes');
const DispoRoutes = require('./Routes/DispoRoutes');
const RdvRoutes = require('./Routes/RdvRoutes');
const NoteRoutes = require('./Routes/NoteRoutes');
const SubAdminRoutes = require('./Routes/SubAdminRoutes');
const SuperAdminRoutes = require('./Routes/SuperAdminRoutes');
const PartnerRoutes = require('./Routes/partnersRoutes');
const PartnerClientsRoutes = require('./Routes/partnerClientsRoutes');
const ServiceRoutes = require('./Routes/ServiceRoutes')
const TeamRoutes = require('./Routes/TeamRoutes');
const InvoiceRoutes = require('./Routes/InvoiceRoutes');
const testRoutes = require('./Routes/test');
const RapportRoutes = require('./Routes/RapportRoutes');
const MessagesRoutes = require('./Routes/MessageRoutes');
const MyPatientRoutes = require('./Routes/MypatientRoutes');
const DashboardRoutes = require('./Routes/DashboardRoutes');
const { RdvTimeOver } = require('./Controllers/RdvController');
const { notPaidInvoices } = require('./Controllers/InvoiceController');
const isAuth = require('./Midlewares/AuthMidleware');

const { sendMessage, loadMessages } = require('./Controllers/MessageController')

//==================================================//
app.use(fileUpload());
app.use('/users', UserRoutes);
app.use('/providers', ProviderRoutes);
app.use('/categories', CategoryRoutes);
app.use('/specialties', SpecialtyRoutes);
app.use('/patient', PatientActivationRoute);
app.use('/provider', ProviderActivationRoute);
app.use('/rdvtype', RdvTypeRoutes);
app.use('/rdv',isAuth, RdvRoutes);
app.use('/note', isAuth, NoteRoutes);
app.use('/subadmin' ,SubAdminRoutes);
app.use('/superadmin' ,SuperAdminRoutes);
app.use('/partner' ,PartnerRoutes);
app.use('/partnerclients' ,PartnerClientsRoutes);
app.use('/services', isAuth ,ServiceRoutes);
app.use('/teams', isAuth ,TeamRoutes);
app.use('/invoice', isAuth ,InvoiceRoutes);
app.use('/test' ,testRoutes);
app.use('/dispo', DispoRoutes);
app.use('/rapport', RapportRoutes);
app.use('/messages', MessagesRoutes);
app.use('/mypatient', MyPatientRoutes);
app.use('/dashboard',isAuth, DashboardRoutes);

app.get('/', (req, res) => { res.send('hello') })


app.post('/testpusher', (req, res) => {
    
})

cron.schedule('0 0 * * *', () => { // Runs every day
    RdvTimeOver();
    notPaidInvoices();
    console.log("Cron job executed");
});

// Start the server
server.listen(3000, () => {
    console.log(`Server running on port ${3000}`);
});
