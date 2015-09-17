'use strict'

var util = require('util')
var bcrypt = require('bcrypt')
var TokenStore = require('passwordless-tokenstore')

/**
 * Constructor of NedbStore
 * @param {Object} [datastore] the data storage declared upon creation/loading
 * as defined by the NeDB specification. Please check the documentation for 
 * details: https://github.com/louischatriot/nedb
 * @param {String} [documentsName] A valid string identifier. All created 
 * documents within database has value { _lib: passwordless-token } as the 
 * default reference, this will override the default name. Usefull for easy
 * indexing and search when you want to integrate the database with other 
 * documents as well
 * @constructor
 */
function NedbStore(datastore, documentsName) {
    if(arguments.length === 0 || typeof datastore !== 'object')  {
        throw new Error('Valid datastore parameter have to be provided')
    }
    if (arguments[1]) {
        if (typeof arguments[1] !== 'string') {
            throw new Error('documentsName must be a valid string')
        }
    }

    TokenStore.call(this)

    this._documentsName = documentsName || 'passwordless-token'

    this._db = datastore
}

util.inherits(NedbStore, TokenStore)

/**
 * Checks if the provided token / user id combination exists and is
 * valid in terms of time-to-live. If yes, the method provides the 
 * the stored referrer URL if any. 
 * @param  {String}   token to be authenticated
 * @param  {String}   uid Unique identifier of an user
 * @param  {Function} callback in the format (error, valid, referrer).
 * In case of error, error will provide details, valid will be false and
 * referrer will be null. If the token / uid combination was not found 
 * found, valid will be false and all else null. Otherwise, valid will 
 * be true, referrer will (if provided when the token was stored) the 
 * original URL requested and error will be null.
 */
NedbStore.prototype.authenticate = function(token, uid, callback) {
    if (!token || !uid || !callback) {
        throw new Error('TokenStore:authenticate called with invalid parameters')
    }

    this._get_doc(function(db) {
        db.findOne({ _uid: uid, ttl: { $gt: new Date() }}, function (err, item) {
            if (err) {
                callback(err, false, null)
            } else if (item) {
                bcrypt.compare(token, item.hashedToken, function (err, res) {
                    if (err) {
                        callback(err, false, null)
                    } else if (res) {
                        callback(null, true, item.originUrl)
                    } else {
                        callback(null, false, null)
                    }
                })

            } else {
                callback(null, false, null)
            }
        })
    })
}

/**
 * Stores a new token / user ID combination or updates the token of an
 * existing user ID if that ID already exists. Hence, a user can only
 * have one valid token at a time
 * @param  {String}   token Token that allows authentication of _uid_
 * @param  {String}   uid Unique identifier of an user
 * @param  {Number}   msToLive Validity of the token in ms
 * @param  {String}   originUrl Originally requested URL or null
 * @param  {Function} callback Called with callback(error) in case of an
 * error or as callback() if the token was successully stored / updated
 */
NedbStore.prototype.storeOrUpdate = function(token, uid, msToLive, originUrl, callback) {

    var self = this

    if (!token || !uid || !msToLive || !callback) {
        throw new Error('TokenStore:storeOrUpdate called with invalid parameters')
    }
    this._get_doc(function(db) {
        bcrypt.hash(token, 10, function(err, hashedToken) {
            if (err) {
                return callback('token creation fail: ' + err)
            }

            var newRecord = {
                _lib: self._documentsName,
                _uid: uid,
                hashedToken: hashedToken,
                ttl: new Date(Date.now() + msToLive),
                originUrl: originUrl
            }

            // Insert or update
            db.update({ _uid: uid }, newRecord, { upsert: true }, function (err) {
                if (err) {
                    callback(err)
                } else {
                    callback()
                }
            })
        })
    })
}

/**
 * Invalidates and removes a user and the linked token
 * @param  {String}   user ID
 * @param  {Function} callback called with callback(error) in case of an
 * error or as callback() if the uid was successully invalidated
 */
NedbStore.prototype.invalidateUser = function(uid, callback) {
    if (!uid || !callback) {
        throw new Error('TokenStore:invalidateUser called with invalid parameters')
    }
    this._get_doc(function(db) {
        db.remove({
            _uid: uid
        }, {}, function(err) {
            if (err) {
                callback(err)
            } else {
                callback()
            }
        })
    })
}

/**
 * Removes and invalidates all token
 * @param  {Function} callback Called with callback(error) in case of an
 * error or as callback() if the token was successully stored / updated
 */
NedbStore.prototype.clear = function(callback) {
    if (!callback) {
        throw new Error('TokenStore:clear called with invalid parameters')
    }
    this._get_doc(function(db) {
        db.remove( {}, { multi: true }, function (err) {
            if (err) {
                callback(err)
            } else {
                callback()
            }
        })
    })
}

/**
 * Number of tokens stored (no matter the validity)
 * @param  {Function} callback Called with callback(null, count) in case
 * of success or with callback(error) in case of an error
 */
NedbStore.prototype.length = function(callback) {
    this._get_doc(function(db) {
        db.count({}, function (err, count) {
            if (err) {
                callback(err)
            } else {
                callback(null, count)
            }
        })
    })
}

/**
 * Private method to connect to the right collection
 * @private
 */
NedbStore.prototype._get_doc = function(callback) {
    var self = this
    var db = self._db

    db.loadDatabase(function (err) {
        if (err) {
            throw new Error('load database fail: ' + err)
        } else {
            callback(db)
        }
    })
}
module.exports = NedbStore