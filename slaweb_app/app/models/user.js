import Model from './main';
import {attr} from './main';

var User = Model.extend({
    id: attr(),
    email: attr(),
    is_staff: attr(),
    url: attr(),

    serialize: function() {
        var serializedUser = this._super();
        if (this.get('password')) {
            serializedUser.password = this.get('password');
        }
        return serializedUser;
    }
});

User.url = '/users';
User.primaryKey = 'id';

export default User;