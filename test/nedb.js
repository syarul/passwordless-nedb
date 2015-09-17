'use strict'

var expect = require('chai').expect
var uuid = require('node-uuid')
var chance = new require('chance')()

var NedbStore = require('../lib/nedb')
var testUri = './db.json'

var standardTests = require('passwordless-tokenstore-test')

var Datastore = require('nedb')
var db = new Datastore({ filename: testUri})

function TokenStoreFactory() {
    return new NedbStore(db)
}

var beforeEachTest = function(done) {
    db.loadDatabase(function(err) {
        if (err) {
            return done(err)
        }
        db.remove({}, { multi: true }, function (err) {
            if (err) {
                return done(err)
            } else {
                done()
            }
        })
    })
}

var afterEachTest = function(done) {
    done()
}

// Call all standard test
standardTests(TokenStoreFactory, beforeEachTest, afterEachTest)

describe('Specific tests', function() {

    beforeEach(function(done) {
        beforeEachTest(done)
    })

    afterEach(function(done) {
        afterEachTest(done)
    })

    it('should not allow the instantiation with an empty constructor', function() {
        expect(function() {
            new NedbStore()
        }).to.throw(Error)
    })

    it('should not allow the instantiation with an empty constructor', function() {
        expect(function() {
            new NedbStore(123)
        }).to.throw(Error)
    })

    it('should allow proper instantiation', function() {
        expect(function() {
            TokenStoreFactory()
        }).to.not.throw()
    })

    it('should allow proper instantiation with second arguments as string', function () {
        function newTokenStoreFactory() {
            return new NedbStore(db, 'whats up bruh')
        }

        expect(function() { 
            newTokenStoreFactory()
        }).to.not.throw()
    })

    it('should not allow the instantiation with second arguments not as string', function () {
        function newTokenStoreFactory() {
            return new NedbStore(db, 123)
        }

        expect(function() { 
            newTokenStoreFactory()
        }).to.throw(Error)
    })

    it('should default to "passwordless-token" as documents name', function(done) {
        var store = TokenStoreFactory()

        store.length(function(err, length) {
            expect(err).to.not.exist
            expect(length).to.equal(0)
        })
			
        store.storeOrUpdate(uuid.v4(), chance.email(), 1000*60, 'http://' + chance.domain() + '/page.html', function() {
            db.findOne({ _lib: 'passwordless-token' }, function (err, docs) {
                expect(docs).to.exist
                expect(err).to.not.exist
                done()
            })
        })
    })

    it('should store tokens only in their hashed form', function (done) {
        var store = TokenStoreFactory()
        var token = uuid.v4()
        var uid = chance.email()
        store.storeOrUpdate(token, uid, 1000*60, 'http://' + chance.domain() + '/page.html', function() {
            db.findOne({_uid: uid}, function (err, item) {
                expect(item._uid).to.equal(uid)
                expect(item.hashedToken).to.not.equal(token)
                done()
            })
        })
    })
	
    it('should store tokens not only hashed but also salted', function (done) {
        var store = TokenStoreFactory()
        var token = uuid.v4()
        var uid = chance.email()
        store.storeOrUpdate(token, uid, 1000*60, 'http://' + chance.domain() + '/page.html', function() {
            db.findOne({_uid: uid}, function (err, item) {
                var hashedToken1 = item.hashedToken
                store.clear(function() {
                    store.storeOrUpdate(token, uid, 1000*60, 'http://' + chance.domain() + '/page.html', function() {
                        db.findOne({_uid: uid}, function (err, item) {
                            var hashedToken2 = item.hashedToken
                            expect(hashedToken2).to.not.equal(hashedToken1)
                            done()
                        })
                    })
                })
            })
        })
    })
	
})