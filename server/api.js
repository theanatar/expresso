const express = require('express');
const apiRouter = express.Router();

const employeesRouter = require('./employee');
apiRouter.use('/employees', employeesRouter);

const menuRouter = require('./menu');
apiRouter.use('/menus', menuRouter);

module.exports = apiRouter;