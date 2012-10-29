var mongoose = require("mongoose"),
    Schema = mongoose.Schema,
    Types = Schema.Types,
    ObjectId = Types.ObjectId,
    argv = require("optimist").argv;
var db = mongoose.createConnection("mongodb://" + argv.dbuser + ":" + argv.dbpass + "@" + argv.dbserver + ":" + argv.dbport + "/" + argv.dbname + "", {});
var UserSchema = Schema();
UserSchema.add({
    username: {
        type: String,
        index: {
            unique: true
        }
    },
    password: String,
    salt: String,
    email: {
        type: String,
        index: {
            unique: true
        }
    },
    session: {
        _id: ObjectId,
        started: Date,
        lastActivity: Date
    },
    relationships: [new Schema({
        _id: {
            type: ObjectId,
            ref: 'users',
            index: {}
        },
        relationship: Boolean, // true=friend, null=uniary, false=enemy
        when: Date
    })]
});
module.exports.User = db.model('users', UserSchema);
