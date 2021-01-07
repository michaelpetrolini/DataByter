'use strict';

function sequencer() {
    let i = 1;
    return function () {
        const n = i;
        i++;
        return n;
    }
}

class Task {
    constructor(id, description) {
        this._id = id;
        this._description = description;
        this._timestamp = new Date();
    }

    //@formatter:off
    get id() { return this._id; }
    get description() { return this._description; }
    set description(description) { this._description = description; }
    get timestamp() { return this._timestamp; }
    //@formatter:on
}

const seq = sequencer();
const tasks = [];

for (let i = 0; i < 5; i++) {
    const id = seq();
    tasks.push(new Task(id, `Spend more time hacking #${id}`));
}

function toDTO(task) {
    return {
        id: task.id,
        description: task.description,
        timestamp: task.timestamp // should be converted according to ISO8601
    };
}

function isNonBlank(str) {
    return typeof str === 'string' && str.trim();
}

function isInteger(n) {
    if (typeof n === 'number') {
        return true;
    }
    if (typeof n === 'string') {
        try {
            parseInt(n, 10);
            return true;
        } catch (_) {
            return false;
        }
    }
    return false;
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
                    dbo.collection("projects").find({}).toArray(function (err, result) {
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
            dbo.collection("projects").findOne({"projectId": projectId}, function(err, projectHeader) {
                if (err) throw err;
                const getPromise = () => {
                    return new Promise((resolve, reject) => {
                        dbo.collection("entries").find({"projectId": projectId, isActive: true}).toArray(function (err, entries) {
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
            const update = {$set:{lastUpdate: today}, $inc:{entryId: 1}};
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
        if (!isNonBlank(newProject.pName) || newProject.fields.length === 0 || newProject.labels.length === 0) {
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
                resp.json(toDTO(result));
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
                    resp.json(toDTO(result));
                });
            });
        });
    });
}

module.exports = {routes};
