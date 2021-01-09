'use strict';

function isNonBlank(str) {
    return typeof str === 'string' && str.trim();
}

function routes(app) {
    const mongoClient = require('mongodb').MongoClient;
    const url = "mongodb://localhost:27017/";

    app.get('/projects', (req, resp) => {
        console.debug('Retrieving all projects');
        mongoClient.connect(url, function(err, db) {
            if (err)
                throw err;
            const dbo = db.db("databyter");
            const getPromise = () => {
                return new Promise((resolve, reject) => {
                    dbo.collection("projects").find({}).sort({projectId: 1}).toArray(function (err, result) {
                        err ? reject(err) : resolve(result);
                    });
                });
            };
            const execGetPromise = async () => {
          
                var result = await (getPromise());
                return result;
             };
             execGetPromise().then(function(result) {          
                db.close();
                resp.json({
                    total: result.length,
                    results: result
                });
             });
        });
    });

    app.get('/project', (req, resp) => {
        const projectId = parseInt(req.query.id);
        console.debug('Retrieving project with id ' + projectId);
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            dbo.collection("projects").findOne({"projectId": projectId}, function(err, project) {
                if (err) throw err;
                db.close();
                resp.json({
                    project: project
                });
            });
        });
    });

    app.get('/entries', (req, resp) => {
        console.debug('Retrieving project details');
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            const projectId = parseInt(req.query.id);
            dbo.collection("projects").findOne({projectId: projectId}, function(err, projectHeader) {
                if (err) throw err;
                const getPromise = () => {
                    return new Promise((resolve, reject) => {
                        dbo.collection("entries").find({projectId: projectId, isActive: true}).sort({entryId: 1}).toArray(function (err, entries) {
                            err ? reject(err) : resolve(entries);
                        });
                    });
                };
                const execGetPromise = async () => {
              
                    var result = await (getPromise());
                    return result;
                 };
                 execGetPromise().then(function(result) {          
                    db.close();
                    resp.json({
                        header: projectHeader,
                        total: result.length,
                        results: result
                    });
                 });
            });
        });
    });

    app.get('/entry', (req, resp) => {
        const projectId = parseInt(req.query.projectId);
        const entryId = parseInt(req.query.entryId);
        console.debug('Retrieving entry');
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            dbo.collection("entries").findOne({projectId: projectId, entryId: entryId, isActive: true}, function(err, entry) {
                if (err) throw err;
                db.close();
                console.log(entry);
                resp.json({
                    entry: entry
                });
            });
        });
    });

    app.get('/entryHistory', (req, resp) => {
        console.debug('Retrieving entry history');
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            const projectId = parseInt(req.query.projectId);
            const entryId = parseInt(req.query.entryId);
            const getPromise = () => {
                return new Promise((resolve, reject) => {
                    dbo.collection("entries").find({projectId: projectId, entryId: entryId}).sort({version: -1}).toArray(function (err, entries) {
                        err ? reject(err) : resolve(entries);
                    });
                });
            };
            const execGetPromise = async () => {
            
                var result = await (getPromise());
                return result;
                };
                execGetPromise().then(function(result) {          
                db.close();
                resp.json({
                    total: result.length,
                    results: result
                });
                });
        });
    });

    app.get('/piechartData', (req, resp) => {
        const projectId = parseInt(req.query.projectId);
        console.debug('Retrieving project balance stats');
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            const firstMatch = {$match: {projectId: projectId, isActive: true}};
            const unwind = {$unwind: '$fields'};
            const secondMatch = {$match: {'fields.isLabel': true}};
            const firstGroup = {$group: {_id: {value: '$fields.value'}, occurrences:{$sum: 1}}};
            const secondGroup = {$group: {_id: null, labels: {$push: {label: '$_id.value', occurrences: '$occurrences'}}}};
            const getPromise = () => {
                return new Promise((resolve, reject) => {
                    dbo.collection("entries").aggregate([firstMatch, unwind, secondMatch, firstGroup, secondGroup]).toArray(function (err, entries) {
                        err ? reject(err) : resolve(entries);
                    });
                });
            };
            const execGetPromise = async () => {
            
                var result = await (getPromise());
                return result;
            };
            execGetPromise().then(function(result) { 
                dbo.collection("projects").findOne({projectId: projectId}, function(err, project){
                    if (err) throw err;
                    db.close();
                    resp.json({sizeTarget: project.sizeTarget,
                        balance: result});
                });         
            });
        });
    });

    app.post('/checkUser', (req, resp) => {
        const username = req.body.username;
        const password = req.body.password;
        console.debug('Checking if user is registered');
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            dbo.collection("users").countDocuments({username: username, password: password}, function(err, result) {
                if (err) throw err;
                db.close();
                const canAccess = result == 1? true: false;
                resp.json({
                    canAccess: canAccess
                });
            });
        });
    });

    app.post('/registerUser', (req, resp) => {
        const email = req.body.email;
        const username = req.body.username;
        const password = req.body.password;
        const passwordCheck = req.body.passwordCheck;
        console.debug('Trying to register a new user');
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            dbo.collection("users").countDocuments({email: email}, function(err, result) {
                if (err) throw err;
                if(result !== 0){
                    resp.json({
                        status: false,
                        errorCode: 1
                    });
                } else {
                    dbo.collection("users").countDocuments({username: username}, function(err, result) {
                        if (err) throw err;
                        if(result !== 0){
                            resp.json({
                                status: false,
                                errorCode: 2
                            });
                        } else {
                            if(password !== passwordCheck){
                                resp.json({
                                    status: false,
                                    errorCode: 3
                                });
                            } else {
                                dbo.collection("users").insertOne({email: email, username: username, password: password}, function(err, result) {
                                    if (err) throw err;
                                    resp.json({status: true});
                                });
                            }
                        }
                    });
                }
            });
        });
    });

    app.post('/addEntry', (req, resp) => {
        const newEntry = req.body;
        const projectId = parseInt(req.query.id);
        console.debug('Attempting to add a new entry', newEntry);
        /*
        if (!isNonBlank(newProject.pName) || newProject.fields.length === 0 || newProject.labels.length === 0) {
            resp.status(400);
            resp.json({error: 'Error in the format of the project'});
            return;
        }
        */
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            const query = {projectId: projectId};
            const today = new Date().toISOString().slice(0,10);
            const update = {$set:{lastEntry: today}, $inc:{entryId: 1}};
            dbo.collection("projects").findOneAndUpdate(query, update, function(err, result) {
              if (err) throw err;
              newEntry.projectId = result.value.projectId;
              newEntry.entryId = result.value.entryId;
              newEntry.creationDate = today;
              newEntry.version = 0;
              newEntry.isActive = true;
              dbo.collection("entries").insertOne(newEntry, function(err, result) {
                if (err) throw err;
                console.log("Entry saved successfully");
                db.close();
                resp.status(201);
                resp.json(newEntry);
              });
            });
        });
    });

    app.post('/saveProject', (req, resp) => {
        const newProject = req.body;
        console.debug('Attempting to crete a new project', newProject);
        if (!isNonBlank(newProject.pName) || newProject.fields.length == 0 || newProject.labels.length == 0) {
            resp.status(400);
            resp.json({error: 'Error in the format of the project'});
            return;
        }
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            const query = {type: "project"};
            const increment = {$inc:{id: 1}};
            dbo.collection("id-manager").findOneAndUpdate(query, increment, function(err, result) {
              if (err) throw err;
              newProject.projectId = result.value.id;
              newProject.entryId = 1;
              dbo.collection("projects").insertOne(newProject, function(err, result) {
                if (err) throw err;
                console.log("Project saved successfully");
                db.close();
                resp.status(201);
                resp.json(newProject);
              });
            });
        });
    });

    app.put('/entry', (req, resp) => {
        const newEntry = req.body;
        const projectId = parseInt(req.query.projectId);
        const entryId = parseInt(req.query.entryId);
        console.debug('Attempting to update a entry', newEntry);
        /*
        if (!isNonBlank(newProject.pName) || newProject.fields.length === 0 || newProject.labels.length === 0) {
            resp.status(400);
            resp.json({error: 'Error in the format of the project'});
            return;
        }
        */
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            const query = {projectId: projectId, entryId: entryId, isActive: true};
            const today = new Date().toISOString().slice(0,10);
            const update = {$set:{isActive: false}};
            dbo.collection("entries").findOneAndUpdate(query, update, function(err, result) {
              if (err) throw err;
              newEntry.projectId = result.value.projectId;
              newEntry.entryId = result.value.entryId;
              newEntry.creationDate = today;
              newEntry.version = parseInt(result.value.version) + 1;
              newEntry.isActive = true;
              dbo.collection("entries").insertOne(newEntry, function(err, result) {
                if (err) throw err;
                console.log("Entry updated successfully");
                db.close();
                resp.status(201);
                resp.json(newEntry);
              });
            });
        });
    });

    app.put('/changePassword', (req, resp) => {
        const email = req.body.email;
        const username = req.body.username;
        const password = req.body.password;
        const passwordCheck = req.body.passwordCheck;
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            dbo.collection("users").countDocuments({username: username, email: email}, function(err, result) {
                if (err) throw err;
                if(result === 0){
                    db.close();
                    resp.json({
                        status: false,
                        errorCode: 1
                    });
                } else {
                    if(password !== passwordCheck){
                        db.close();
                        resp.json({
                            status: false,
                            errorCode: 2
                        });
                    } else {

                    }
                    const query = {username: username, password: password}
                    const update = {$set: {password: password}}
                    dbo.collection("users").updateOne(query, update, function(err, result){
                        if (err) throw err;
                        db.close();
                        resp.json({status: true})
                    });
                }
            });
        });
    });

    app.delete('/entry', (req, resp) => {
        const projectId = parseInt(req.query.projectId);
        const entryId = parseInt(req.query.entryId);
        console.debug('Attempting to delete entry ', {projectId: projectId, entryId: entryId});
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            const query = {projectId: projectId, entryId: entryId};
            dbo.collection("entries").deleteMany(query, function(err, result) {
                if (err) throw err;
                console.info('Entry successfully deleted');
                resp.status(200);
                resp.json(result);
            });
        });
    });

    app.delete('/project', (req, resp) => {
        const projectId = parseInt(req.query.projectId);
        console.debug('Attempting to delete project ', {projectId: projectId});
        mongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("databyter");
            const query = {projectId: projectId};
            dbo.collection("projects").deleteOne(query, function(err, result) {
                if (err) throw err;
                dbo.collection("entries").deleteMany(query, function(err, result){
                    console.info('Project successfully deleted');
                    if (err) throw err;
                    resp.status(200);
                    resp.json(result);
                });
            });
        });
    });
}

module.exports = {routes};
