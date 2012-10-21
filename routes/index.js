exports.index = function(req, res){
    db.open(function(err, db) {
        db.authenticate("chat-io-admin", "pass", function(err, result) {
            if(!err) {
                db.collection("users", function(err, collection) {
                    if(!err) {
                        collection.find({username:"mashumafi"}).toArray(function(err, items) {
                            if(err == null) {
                                res.render('index', { title: 'Express', result: items[0].email });
                            } else {
                                res.send(err);
                            }
                        });
                    } else {
                        res.send(err);
                    }
                });
            } else {
                res.send(err);
            }
        });
    });
};