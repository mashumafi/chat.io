var mongoose = require("mongoose"),
    Schema = mongoose.Schema,
    Types = Schema.Types,
    ObjectId = Types.ObjectId,
    argv = require("optimist").argv;
var db = mongoose.createConnection("mongodb://" + argv.dbuser + ":" + argv.dbpass + "@" + argv.dbserver + ":" + argv.dbport + "/" + argv.dbname + "", {});
var UserSchema = Schema(), RelationshipSchema = Schema();
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
        _id: String,
        started: Date,
        lastActivity: Date
    }
});
RelationshipSchema.add({
    owner: {
        type: ObjectId,
        ref: 'users'
    },
    other: {
        type: ObjectId,
        ref: 'users',
        index: true
    },
    relationship: Boolean, // true=friend, null=uniary, false=enemy
    when: Date
});
RelationshipSchema.index({owner_id:1,other_id:1,index:true,unique:true});
module.exports.User = db.model('users', UserSchema);
module.exports.Relationship = db.model('relationships', RelationshipSchema);
