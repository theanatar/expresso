const express = require('express');
const app = express();
const bodyParser = require('body-parser');

module.exports = app;

const PORT = process.env.PORT || 4000;
app.use(express.static('public'));

app.use(bodyParser.json());

const apiRouter = require('./server/api.js');
app.use('/api', apiRouter);

if(!module.parent){
    app.listen(PORT, ()=> {
        console.log('Server listening on port ' + PORT);
    });
}