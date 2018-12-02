import Ember from 'ember';

var ShowHideTd = Ember.View.extend({

    hidden: true,


      mouseEnter: function() {
          this.set('hidden',false);
      },
      mouseLeave: function() {
          this.set('hidden',true);
      },
    Show: function () {
        this.hidden = true;
    },

      Hide: function () {
          this.hidden = false;
      }

});

export default ShowHideTd;/**
 * Created by matus on 6.12.2014.
 */
