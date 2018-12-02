import BaseFilterSectionComponent from './base-filter-section';
import {cmp_users} from 'slameter/lib/select-constraints';

var TimeFilterAppsComponent = BaseFilterSectionComponent.extend({

    init: function(){
        this._super();
        this.mapValuesOut({'interval_type': 'named', 'interval_value': 'last_hour'});
    },
    show_named: true,
    show_relative: false,
    noUsersLoaded: false,
    currentCalcType:  'named',
    currentNamedSelect:  'last_hour',
    currentRelativeSelect: 'hours',
    currentRelativeValue: 1,
    calcTypeSelect: cmp_users['calcTypeSelect'],
    namedSelect: cmp_users['namedSelect'],
    relativeSelect: cmp_users['relativeSelect'],

    calc_type_method: function(){
        if (this.get('currentCalcType')==='relative'){
            this.setProperties({
                'show_relative': true,
                'show_named': false,
                'show_calendar': false
                }
        );

        }
        else{
            if(this.get('currentCalcType')==='absolete'){
                this.setProperties({
                        'show_relative': false,
                        'show_named': false,
                        'show_calendar': true
                        }
                );
            }
            else{
                this.setProperties({
                        'show_relative': false,
                        'show_named': true,
                        'show_calendar': false
                        }
                );

            }

        }
    }.observes('currentCalcType'),

    mapValuesIn: function(){
        this.mapValuesOut();
    }.observesImmediately('inputValue'),
    mapValuesOut: function() {
        if (this.get('currentCalcType') === 'absolete') {
            response = {'interval_type': 'absolete', 'time_from':this.get('startTime'), 'time_to':this.get('endTime')};
        } else {
            if (this.get('currentCalcType') === 'relative') {
                response = {
                    'interval_type': 'relative',
                    'interval_value': this.get('currentRelativeSelect'),
                    'interval_second_value': this.get('currentRelativeValue')
                };
            }
        else {
                response = {'interval_type': 'named', 'interval_value': this.get('currentNamedSelect')};
            }
        }
        var response;
        this.set('outputValue', response);

    }.observes('currentCalcType', 'currentNamedSelect', 'currentRelativeSelect', 'currentRelativeValue', 'startTime', 'endTime', 'inputValue')


});

export default TimeFilterAppsComponent;
