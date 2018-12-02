import Ember from 'ember';

var ShowHideTd = Ember.View.extend({

    hidden: true,

      click: function() {
        if (this.hidden===true){
            this.set('hidden',false);
        }
        else{
            this.set('hidden',true);
        }

      },
    Show: function () {
        this.hidden = true;
    },

      Hide: function () {
          this.hidden = false;
      }

});

export default ShowHideTd;
