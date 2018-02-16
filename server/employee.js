const express = require('express');
const employeeRouter = express.Router();

const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

//Validate if employee exists
employeeRouter.use('/:employeeId', (req, res,next)=>{
    db.get('select id from employee where id = ?', req.params.employeeId, (error, result)=> {
        if(!result){
            res.status(404).send();
        } else {
            next();
        }
    });
});

//Get all employees
employeeRouter.get('/', (req, res, next)=>{
    db.all("select * from Employee where is_current_employee = 1", (error, results)=> {
        if (error){
            res.status(500).send(error.message);
        } else {
            res.status(200).send({employees: results});
        }
    });
});

//Get an employee
employeeRouter.get('/:employeeId', (req, res, next)=>{
    var query = `select * from Employee where id = ${req.params.employeeId}`;
    db.get(query, (error, result)=> {
        if (error){
            res.status(500).send(error.message);
        } else {
            if(result){
                res.status(200).send({employee: result});
            } else {
                res.status(404).send();
            }
        }
    });
});

//Add a new employee
employeeRouter.post('/', (req, res, next)=>{
        db.get('select max(id) + 1 as nextId from employee', (error, result)=> {
        if(error){
            res.status(500).send({error: error.message});
        } else {
            addEmployee(result.nextId, req, res);
        }
    });
});

function addEmployee(nextId, req, res){
    var employee = req.body.employee;
    if(!employee.name || !employee.position || !employee.wage){
        res.status(400).send();
    }
    var params = [nextId, employee.name, employee.position, employee.wage, 1];
    db.run("INSERT INTO employee VALUES (?,?,?,?,?)", params, (error)=>{
        if(error){
            res.status(500).send({error: error.message});
        } else {
            employee.id = nextId;
            employee.is_current_employee = 1;
            res.status(201).send({employee: employee});
        }
    });
}

//Update an employee
employeeRouter.put('/:employeeId', (req, res, next)=>{
    var id = req.params.employeeId;
    updateEmployee(id, req, res);
});

function updateEmployee(id, req, res){
    var emp = req.body.employee;
    if(!emp.name || !emp.position || !emp.wage){
        res.status(400).send();
    }
    var params = [emp.name, emp.position, emp.wage, id];
    db.run('update employee set name = ?, position = ?, wage = ? where id = ?', params, (error)=> {
        if(error){
            res.status(500).send({error: error.message});
        } else {
            emp.id = Number(id);
            res.status(200).send({employee: emp});
        }
    });
}

//Delete Employee
employeeRouter.delete('/:employeeId', (req, res, next)=> {
    var id = req.params.employeeId;
    deleteEmployee(id, req, res);
});

function deleteEmployee(id, req, res){
    db.run('update employee set is_current_employee = 0 where id = ?', id, (error)=>{
        if(error){
            res.status(500).send({error: error.message});
        } else {
            db.get('select * from employee where id = ?', id, (error, result)=>{
                if(error) {res.status(500).send({error: error.message});} else {
                    res.status(200).send({employee: result});
                }
            });
        }
    })
};

//timesheets ======================================================

//Get employee timesheet
employeeRouter.get('/:employeeId/timesheets', (req, res, next)=>{
    db.all("select * from timesheet where employee_id = ?", req.params.employeeId, (error, results)=> {
        if (error){
            res.status(500).send(error.message);
        } else {
            if(results){
                res.status(200).send({timesheets: results});
            } else {
                res.status(200).send({timesheets: []});
            }
        }
    });
});

//Add a new timesheet
employeeRouter.post('/:employeeId/timesheets', (req, res, next)=>{
    db.get('select max(id) + 1 as nextId from timesheet', (error, result)=> {
        if(error){
            res.status(500).send({error: error.message});
        } else {
            var nextId = result.nextId;
            var timesheet = req.body.timesheet;
            if(!timesheet.hours || !timesheet.rate || !timesheet.date){
                res.status(400).send();
            }
            var params = [nextId, timesheet.hours, timesheet.rate, timesheet.date, req.params.employeeId];
            db.run("INSERT INTO timesheet VALUES (?,?,?,?,?)", params, (error)=>{
                if(error){
                    res.status(500).send({error: error.message});
                } else {
                    timesheet.id = nextId;
                    timesheet.employee_id = Number(req.params.employeeId);
                    res.status(201).send({timesheet: timesheet});
                }
            });
        }
    });
});

//Update a timesheet
employeeRouter.put('/:employeeId/timesheets/:timesheetId', (req, res, next)=>{
    db.get('select id from timesheet where id = ?', req.params.timesheetId, (error, result)=>{
        if(!result){
            res.status(404).send();
        } else {
            updateTimesheet(req, res);
        }
    });
});

function updateTimesheet(req, res){
    var timesheet = req.body.timesheet;
    if(!timesheet.hours || !timesheet.rate || !timesheet.date){
        res.status(400).send();
        return;
    }
    var params = [timesheet.hours, timesheet.rate, timesheet.date, req.params.timesheetId];
    db.run('update timesheet set hours = ?, rate = ?, date = ? where id = ?', params, (error)=>{
        if(error){
            res.status(500).send({error: error.message});
        } else {
            timesheet.id = req.params.timesheetId;
            timesheet.employee_id = Number(req.params.employeeId);
            res.status(200).send({timesheet: timesheet});
        }
    });
};

//Delete a timesheet
employeeRouter.delete('/:employeeId/timesheets/:timesheetId', (req, res, next)=>{
    db.get('select id from timesheet where id = ?', req.params.timesheetId, (error, result)=>{
        if(!result){
            res.status(404).send();
        } else {
            db.run('delete from timesheet where id = ?', req.params.timesheetId, (error)=>{
                if(error){
                    res.status(500).send({error: error.message});
                } else {
                    res.status(204).send();
                }
            })
        }
    });
});

module.exports = employeeRouter;