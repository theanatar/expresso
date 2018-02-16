const express = require('express');
const menuRouter = express.Router();

const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

//Validate if menu exists
menuRouter.use('/:id', (req, res,next)=>{
    db.get('select id from menu where id = ?', req.params.id, (error, result)=> {
        if(!result){
            res.status(404).send();
        } else {
            next();
        }
    });
});

//Get all menus
menuRouter.get('/', (req, res, next)=>{
    db.all("select * from Menu", (error, results)=> {
        if (error){
            res.status(500).send(error.message);
        } else {
            res.status(200).send({menus: results});
        }
    });
});

//Get a menu
menuRouter.get('/:id', (req, res, next)=>{
    var query = `select * from Menu where id = ${req.params.id}`;
    db.get(query, (error, result)=> {
        if (error){
            res.status(500).send(error.message);
        } else {
            if(result){
                res.status(200).send({menu: result});
            } else {
                res.status(404).send();
            }
        }
    });
});

//Create a menu
menuRouter.post('/', (req, res, next)=>{
    db.get('select max(id) + 1 as nextId from employee', (error, result)=> {
        var nextId;
        if(result){
            nextId = result.nextId
        } else {
            nextId = 1;
        }
        var menu = req.body.menu;
        if(!menu.title){
            res.status(400).send();
        }
        var params = [nextId, menu.title];
        db.run("INSERT INTO Menu VALUES (?,?)", params, (error)=>{
            if(error){
                res.status(500).send({error: error.message});
            } else {
                menu.id = nextId;
                res.status(201).send({menu: menu});
            }
        });
    });
});

//Update a menu
menuRouter.put('/:id', (req, res, next)=>{
    var id = req.params.id;
    var menu = req.body.menu;
    if(!menu.title){
        res.status(400).send();
    }
    var params = [menu.title, id];
    db.run('update menu set title = ? where id = ?', params, (error)=> {
        if(error){
            res.status(500).send({error: error.message});
        } else {
            menu.id = Number(id);
            res.status(200).send({menu: menu});
        }
    });
});

//Delete a menu
menuRouter.delete('/:id', (req, res, next)=>{
    //we don't care if more than one menuItems exist in the menu
    db.get('select id from MenuItem where menu_id = ?', req.params.id, (error, result)=>{
        if(result){
            res.status(400).send();
        } else {
            db.run('delete from menu where id = ?', req.params.id, (error)=>{
                res.status(204).send();
            });
        }
    });
});

//MenuItems ===============================================================

//Get all menu items of a menu
menuRouter.get('/:id/menu-items', (req, res, next)=>{
    db.all('select * from MenuItem where menu_id = ?', req.params.id, (error, results)=>{
        if(results){
            res.status(200).send({menuItems: results});
        } else {
            res.status(200).send({menuItems: []});
        }
    });
});

//Create a menu Item
menuRouter.post('/:id/menu-items', (req, res, next)=>{
    var item = req.body.menuItem;
    if(!item.name || !item.description || !item.inventory || !item.price){
        res.status(400).send();
        return;
    }
    db.get('select max(id) + 1 as nextId from MenuItem', (error, result)=> {
        var nextId;
        if(result){
            nextId = result.nextId
        } else {
            nextId = 1
        }
        var params = [nextId, item.name, item.description, item.inventory, item.price, req.params.id];
        db.run('insert into menuitem values (?,?,?,?,?,?)', params, (error)=>{
            item.id = nextId;
            item.menu_id = Number(req.params.id);
            //console.log(item);
            res.status(201).send({menuItem: item});
        });
    });
});

//Update a menu Item
menuRouter.put('/:id/menu-items/:menuItemId', (req, res,next)=>{
    var item = req.body.menuItem;

    db.get('select id from MenuItem where id = ?', req.params.menuItemId, (error, result)=> {
        if(!result){
            res.status(404).send();
        } else {
            if(!item.name || !item.description || !item.inventory || !item.price){
                res.status(400).send();
                return;
            }
        
            var params = [item.name, item.description, item.inventory, item.price, req.params.menuItemId];
            db.run('update menuitem set name = ?, description = ?, inventory = ?, price = ? where id = ?', params, (error)=>{
                item.id = Number(req.params.menuItemId);
                res.status(200).send({menuItem: item});
            });
        }
    });
});

//Delete a menu Item
menuRouter.delete('/:id/menu-items/:menuItemId', (req, res,next)=>{
    db.get('select id from MenuItem where id = ?', req.params.menuItemId, (error, result)=> {
        if(!result){
            res.status(404).send();
        } else {
            db.run('delete from menuitem where id = ?', req.params.menuItemId, (error)=>{
                res.status(204).send();
            });
        }
    });
});

module.exports = menuRouter;