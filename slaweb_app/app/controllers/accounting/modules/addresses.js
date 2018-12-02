import Ember from 'ember';

import AccUser from 'slameter/models/accounting/accuser';
import ToolManagerMixin from 'slameter/mixins/tool-manager';
var AddressesController = Ember.Controller.extend(ToolManagerMixin, {
    showed: false,
    isAdmin: false,

    init: function() {
        this.set('isAdmin', this.get('session.user.is_staff'));
        var inputQuery = this.get('inputQuery');
        // var user_id = inputQuery.accuser;
        this._super();
        var user = null;
        var user_id = null;
        if(this.get('isAdmin')===true){
            if(inputQuery !==null && inputQuery !==undefined){
                if(inputQuery.accuser!==0 && inputQuery.accuser!==undefined && inputQuery.accuser!==null){
                    if(inputQuery.accuser!=='all') {
                        user = AccUser.find(inputQuery.accuser === 'int' || parseInt(inputQuery.accuser));

                        if (user !== null) {
                            this.setProperties({'model': user, 'showed': true});
                        }

                    }
                    else{
                        this.set('showed', false);
                    }
                }
            }
            else{
                user_id = this.search_in_url(Array.prototype.slice.call(window.location.href.split("?"), 1));
                if(user_id) {
                    user = AccUser.find(parseInt(user_id, 10));
                    if (user !== null) {
                        this.setProperties({'model': user, 'showed': true});
                    }
                }
            }
        }
        else{
                user =  AccUser.find(this.get('session.user.id'));
                if(user!==null)
                    this.setProperties({'model': user,'showed':true});
            }
    }.observes('inputQuery'),

    search_in_url: function(array) {
        var accuser = null;
        array.forEach(function(entry) {
        if(entry.match('accuser'))
	    accuser = entry.split("=")[1];
        });
        return accuser;
    }


});



export default AddressesController;
