const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const orphanageRoutes = require('./routes/orphanageRoutes');
const orphanRoute = require('./routes/orphanRoutes'); // Ensure the path is correct
const app = express();
const donationRoutes = require('./routes/donationRoutes');
const volunteerRoutes=require('./routes/volunteerRoutes')
const cors=require('cors');
const path=require('path');
app.use(cors());
app.use('/uploads',express.static(path.join(__dirname,'uploads')));
app.use(express.json());


app.use('/api/users', userRoutes);
app.use('/api/orphans', orphanRoute); 

app.use('/api/orphanages', orphanageRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/volunteers', volunteerRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


