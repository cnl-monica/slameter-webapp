import Ember from 'ember';

import {apiCall} from 'slameter/lib/api-connector';
import {concatUrl} from 'slameter/lib/misc';

/**
 * Computed property, which must be used for each model attribute,
 * that is loaded from server.
 * @param [type] nested model class
 * @param [options] additional options
 */
var attr = function(type, options) {
    return Ember.computed(function(key, value) {
        var data = Ember.get(this, '_data');

        if (!data) {
            Ember.set(this, '_data', {});
            data = Ember.get(this, '_data');
        }

        if (value) {
            Ember.set(data, key, value);
        }

        return Ember.get(data, key);
    }).property('_data').meta({isAttribute: true, type: type, options: options});
};

/**
 * Cache for loaded model records.
 */
var RecordStore = Ember.ArrayProxy.extend(Ember.Evented, {
    isLoaded: false,
    isLoading: Ember.computed.not('isLoaded'),

    _didLoad: function() {
        this.trigger('didLoad');
    }.observes('isLoaded'),

    init: function(){
        this.set('content', Ember.A([]));
        this._super();
    },

    removeObject: function(object) {
        var primaryKey = this.modelClass.primaryKey,
            key = Ember.get(object, primaryKey),
            storedObject = this.findBy(primaryKey, key),
            index;

        if (storedObject) {
            index = this.indexOf(storedObject);
            this.removeAt(index);
        }

        return object;
    },

    replaceObject: function(object) {
        var primaryKey = this.modelClass.primaryKey,
            key = Ember.get(object, primaryKey),
            storedObject = this.findBy(primaryKey, key),
            index;

        if (storedObject) {
            index = this.indexOf(storedObject);
            this.removeAt(index);
            this.insertAt(index, object);
        } else {
            this.pushObject(object);
        }

        return object;
    },

    loadAllNested: function() {
        var self = this;

        return Ember.RSVP.all(this.content.map(function(record){
            return record.loadAllNested();
        })).then(function(records) {
            self.set('content', records);
            return self;
        });
    },

    load: function(hash) {
        return this.modelClass.load(hash);
    },

    /**
     * Proxy method to enable model creation when only recordStore reference is available
     * (e.g. when model is nested).
     *
     * @param params params to pass to Ember`s `create` method
     * @returns {*} created model instance
     */
    create: function(params) {
        return this.modelClass.create(params);
    },

    toStringExtension: function() {
        return 'recordStore:'+this.get('modelClass.modelName');
    }

});

/**
 * Base model class.
 */
var Model = Ember.Object.extend(Ember.Evented, {
    /**
     * Loading state
     * @property isLoading
     */
    isLoading: Ember.computed.not('isLoaded'),

    init: function() {
        Ember.set(this, 'isNew', true);
        Ember.set(this, 'isLoaded', false);

        this._super();
    },

    /**
     * Load instance with hash of attributes.
     * Used when loaded from server.
     *
     * @method load
     * @api private
     *
     * @param hash hash of attributes to set on instance
     * @return {Model}
     */
    load: function(hash) {
        Ember.set(this, '_data', hash);
        Ember.set(this, 'isLoaded', true);
        Ember.set(this, 'isNew', false);
        this.trigger('didLoad');

        return this;
    },

    /**
     * Fetches all models that are nested in attributes of this one.
     *
     * @return {Ember.RSVP.Promise}
     */
    loadAllNested: function() {
        var promises = [], self = this;
        this.constructor.eachComputedProperty(function(name, meta){
            if (meta.isAttribute && meta.type && meta.options && meta.options.isNested) {
                var type, promise;
                var url = Ember.get(self, name);

                if (typeof url !== 'string') {
                    return;
                }

                // create new instance of nested model type, so nested attributes do not
                // share same RecordStore instance between instances of parent model
                type = meta.type.extend({});
                type.url = url;

                //store original attribute value
                meta.originalValue = url;

                promise = type.fetchWitNested().then(function(nested){
                    if (nested) {
                        Ember.set(self, name, nested);
                        nested.forEach(function(n) {
                            n.set('_parent', self);
                        });
                    }
                });

                promises.push(promise);
            }
        });

        return Ember.RSVP.all(promises).then(function(){
            return self;
        });
    },

    /**
     * Save model changes
     *
     * @method save
     * @api public
     *
     * @return {Ember.RSVP.Promise}
     */
    save: function() {
        if (Ember.get(this, 'isNew')) {
            // TODO new record
            return this.constructor.createRecord(this);
        } else {
            // TODO modified record
            return this.constructor.saveRecord(this);
        }
    },

    delete: function() {
        return this.constructor.deleteRecord(this);
    },


    /**
     * Serialize data of instance to simple object
     * that can be send to the server.
     * @return {*|any|Object}
     */
    serialize: function() {
        return this.get('_data');
    },

    /**
     * Bulk attribute actualization.
     *
     * @param {object} attributes object with attributes that will override current ones
     */
    mergeAttributes: function(attributes) {
        var data = Ember.get(this, '_data');
        Ember.merge(data, attributes);
    }

});


Model.reopenClass({
    /**
     * Name used for module lookup.
     * Should be same as file name, for lookup of same
     * model names in different apps.
     */
    modelName: 'main',

    /**
     * Primary key attribute of the model
     *
     * @default id
     */
    primaryKey: 'id',

    /**
     * Url for this model class
     */
    url: '',

    /**
     * If this is enabled, actual class used will be class with
     * same modelName and file name, but looked up in active
     * app directory. This class will be used only as fallback.
     *
     * @default false
     */
    _enableClassByAppLookup: false,

    getContainer: function() {
        return this.create({}).container;
    },

    /**
     * Url building method for retrieving module instance from server
     *
     * @method buildUrl
     * @api private
     *
     * @param key value of module`s primary key
     * @returns {string} full url
     */
    buildUrl: function(key) {
        return concatUrl(this.url, '' + key);
    },

    /**
     * Creates empty placeholder object in recordStore, which
     * will be filled up with actual model instance, once it
     * is loaded from the server.
     *
     * @method createEmptyCacheRecord
     * @api private
     *
     * @param key primary key of placeholder object
     * @returns {object} placeholder object
     */
    createEmptyCacheRecord: function(key) {
        var primaryKey = this.primaryKey;

        var record = {
            isLoaded: false
        };

        record[primaryKey] = key;

        this.addToRecordStore(record);

        return record;
    },

    /**
     * Finds model record(s), either in recordStore, or from server.
     * Does NOT return promise.
     *
     * @method find
     * @api public
     *
     * @param [key] key by which search is done
     * @returns {*}
     */
    find: function(key) {
        if(this.recordStore) {
            if (key) {
                return this.recordStore.findBy(this.primaryKey, key) || null;
            } else {
                return this.recordStore;
            }
        } else {
            if (key) {
                return this._findFetch(key, false);
            } else {
                return this._findFetchAll(false);
            }
        }
    },

    /**
     * Fetches model record(s) from server. Returns promise.
     *
     * @method fetch
     * @api public
     *
     * @param [key] key by which search is done
     * @returns {Ember.RSVP.Promise} promise of model instance or record store array
     */
    fetch: function(key) {
        if(!key) {
            return this._findFetchAll(true);
        } else {
            return this._findFetch(key, true);
        }
    },

    /**
     * Performs fetch, but also fetch all nested models recursively.
     *
     * @method fetchWithNested
     * @api public
     *
     * @param [key] key by which search is done
     * @returns {Ember.RSVP.Promise} promise of model instance or record store array
     */
    fetchWitNested: function(key) {
        return this.fetch(key).then(function(model){
            if (model) {
                return model.loadAllNested();
            } else {
                return Ember.RSVP.resolve();
            }
        });
    },

    /**
     * Private method to find or fetch model instance
     *
     * @method _findFetch
     * @api private
     *
     * @param key key by which search is done
     * @param {Boolean} isFetch whether perform fetch and return promise,
     *                          or perform find and return actual instance / placeholder
     * @returns {Ember.RSVP.Promise|Object}
     * @private
     */
    _findFetch: function(key, isFetch) {
        var self = this,
            record;

        if (this.recordStore) {
            record = this.recordStore.findBy(this.primaryKey, key);
            if (isFetch) {
                return Ember.RSVP.resolve(record);
            } else {
                return record;
            }
        }

        record = this.createEmptyCacheRecord(key);

        var promise = apiCall(this.buildUrl(key)).then(function(data) {
                self.load(data);
                return self;
            }, function(reason){
                Ember.Logger.error('apiCall failed ', reason);
            }, 'ApiCall from model fetch.');

        return  isFetch ? promise : record;
    },

    /**
     * Private method to find or fetch model array
     *
     * @method _findFetchAll
     * @api private
     *
     * @param {Boolean} isFetch whether perform fetch and return promise,
     *                          or perform find and return recordStore
     * @returns {Ember.RSVP.Promise|RecordStore}
     * @private
     */
    _findFetchAll: function(isFetch) {
        var self = this;

        if (this.recordStore) {
            if (isFetch) {
                return Ember.RSVP.resolve(this.recordStore);
            } else {
                return this.recordStore;
            }
        } else {

            this.recordStore = RecordStore.create({modelClass: this});

            var promise = apiCall(this.url).then(function(dataArray) {
                    self.load(dataArray);
                    self.recordStore.set('isLoaded', true);
                    return self.recordStore;
                }, function(reason) {
                    if (reason.type === 'FORBIDDEN') {
                        self.recordStore.set('isLoaded', true);
                        self.recordStore.set('isForbidden', true);
                        return self.recordStore;
                    }
                    // TODO delete recordStore on rejection?
                    Ember.Logger.error('apiCall failed ', reason);
                    return null;
                }, 'model ' + this.modelName + ': load');

            return isFetch ? promise : this.recordStore;
        }

    },

    /**
     * Given array of records from server, this method creates actual model instances
     * and puts them in record store.
     *
     * @method load
     * @api private
     *
     * @param {object|array} array single record or array of records loaded from server
     * @return {array} array of records turned into model instances
     */
    load: function(array) {
        var self = this;
        if (!Ember.isArray(array)) {
            array = [array];
        }

        return Ember.EnumerableUtils.map(array, function(data) {
            var modelClass = self._enableClassByAppLookup ? self._lookupClass(data) : self,
                model = modelClass.create();
            model.load(data);

            if (modelClass !== self) {
                self.addToRecordStore(model);
            }

            modelClass.addToRecordStore(model);

            return model;
        });
    },

    /**
     * Creates new record on the server.
     *
     * @method createRecord
     * @api private
     *
     * @param record record to store on the server.
     * @return {Ember.RSVP.Promise}
     */
    createRecord: function(record) {
        var self = this;
        return apiCall(this.url, record.serialize(), 'POST').then(function(response) {
            return self.load(response);
        });
    },

    /**
     * Saves updated record on the server.
     *
     * @method saveRecord
     * @api private
     *
     * @param record record to update on the server.
     * @return {Ember.RSVP.Promise}
     */
    saveRecord: function(record) {
        var url = this.buildUrl(Ember.get(record, this.primaryKey));
        return apiCall(url, record.serialize(), 'PUT').then(function(response) {
            return record.load(response);
        });
    },

    /**
     * Delete record on the server.
     *
     * @method deleteRecord
     * @api private
     *
     * @param record to delete on the server.
     * @return {Ember.RSVP.Promise}
     */
    deleteRecord: function(record) {
        var self = this;
        return apiCall(this.buildUrl(Ember.get(record, this.primaryKey)) +  '/', null, 'DELETE').then(function() {
            self.recordStore.removeObject(record);
        });
    },




    /**
     * Add record instance to model's record store.
     *
     * @method addToRecordStore
     * @api private
     *
     * @param record record to add to store
     * @return {Model} passed-in record
     */
    addToRecordStore: function(record) {
        if (!this.recordStore) {
            this.recordStore = RecordStore.create({modelClass: this});
        }

        this.recordStore.replaceObject(record);

        return record;
    },

    /**
     * Enables class by app search, while providing nice chainable execution,
     * when classByApp lookup is not enabled by default.
     *
     * Example of usage:
     *
     *  ```javascript
     *      MyModel.classByApp.fetch();
     *  ```
     *
     * @method classByApp
     * @api public
     */
    classByApp: function() {
        this._enableClassByAppLookup = true;
        return this;
    },

    /**
     * Looks up class of this model in current app.
     *
     * @method _lookupClass
     * @api private
     *
     * @param data currently not used
     * @return {Model} class in current app, or `this` class
     */
    _lookupClass: function(data) {
        if (this.modelName) {
            return this.getContainer().lookupFactory('model:$app.' + this.modelName);
        }
        return this;
    },

    toString: function() {
        return 'slameter@model:' + this.modelName;
    }
});


export default Model;
export {attr};
