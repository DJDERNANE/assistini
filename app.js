require('dotenv').config();
const db = require('./config/config');
const express = require('express');
const app = express();

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
const SubAdminRoutes = require('./Routes/SubAdminRoutes')
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
app.use('/subadmin', isAuth ,SubAdminRoutes);
// app.use('/dispo', DispoRoutes);



app.get('/', (req, res) => { res.send('hello') })
// app.listen(process.env.PORT, ()=>{
//     console.log(process.env.PORT)
// })   


io.on('connection', (socket) => {
    console.log('Someone connected');

    socket.on('send_message', ({ senderId, recipientId, message }) => {
        console.log(`Message from ${senderId} to ${recipientId}: ${message}`);
       sendMessage(socket, {senderId, recipientId, message} )
      });
    // Handle disconnect
    socket.on('get_load_messages', ({ senderId }) => {
       loadMessages(socket,senderId )
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Set io instance to make it accessible in controllers


// Start the server
server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
