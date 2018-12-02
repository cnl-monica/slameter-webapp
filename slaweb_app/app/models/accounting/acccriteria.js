import Model from '../main';
import {attr} from '../main';

var AccCriteria = Model.extend({

    id: attr(),
    user_id: attr(),
    sourceIpAddresses: attr(),
    destinationIpAddresses: attr(),
    protocol: attr(),
    sourcePorts: attr(),
    destinationPorts: attr(),
    dscp: attr(),
    multicast: attr(),
    rate_sh: attr(),
    rate_wh: attr(),
    rate_sh_data: attr(),
    rate_wh_data: attr(),

    set_id: function(id){
        this.set('id',id);
    },
    set_user_id: function(user_id){
        this.set('user_id',user_id);
    },
        set_sourceIpAddresses: function(sourceIpAddresses,cleaned){
            if ( (sourceIpAddresses===null || sourceIpAddresses.length===0) && !cleaned){
                this.set('sourceIpAddresses',' ');
            }
            else
                {this.set('sourceIpAddresses',sourceIpAddresses.trim());}
    },
        set_destinationIpAddresses: function(destinationIpAddresses,cleaned){
            if ((destinationIpAddresses===null || destinationIpAddresses.length===0 ) && !cleaned){
                this.set('destinationIpAddresses',' ');
            }
            else
                {this.set('destinationIpAddresses',destinationIpAddresses.trim());}
    },
        set_protocol: function(protocol){
        this.set('protocol',protocol);
    },
        set_sourcePorts: function(sourcePorts,cleaned){
            if ((sourcePorts===null || sourcePorts.length===0) && !cleaned){
                this.set('sourcePorts',' ');
            }
            else
                {this.set('sourcePorts',sourcePorts.trim());}
    },
        set_destinationPorts: function(destinationPorts,cleaned){
            if ((destinationPorts===null || destinationPorts.length===0) && !cleaned){
                this.set('destinationPorts',' ');
            }
            else
                {this.set('destinationPorts',destinationPorts.trim());}
    },
        set_dscp: function(dscp,cleaned){
            if ((dscp===null || dscp.length===0) && !cleaned){
                this.set('dscp',' ');
            }
            else
                {this.set('dscp',dscp.trim());}
    },
        set_multicast: function(multicast){
        this.set('multicast',multicast);
    },
        set_rate_sh: function(rate_sh){
        this.set('rate_sh',rate_sh);
    },
        set_rate_wh: function(rate_wh){
        this.set('rate_wh',rate_wh);
    },
        set_rate_sh_data: function(rate_sh){
        this.set('rate_sh_data',rate_sh);
    },
        set_rate_wh_data: function(rate_wh){
        this.set('rate_wh_data',rate_wh);
    },
        set_priority: function(priority){
        this.set('priority',priority);
    },
    rate_sh_str: function(){
       return this.get('rate_sh').toString();
    },
    rate_wh_str: function(){
       return this.get('rate_wh').toString();
    },
    priority: attr(),
    globalCriterium: attr(),

        set_globalCriterium : function(bool){
            this.set('globalCriterium',bool);
        },
    isMulticast:function(){
        if (this.get('multicast')===true)
            return 'Only';
        else
            return 'Any';
    }.property('multicast'),



    protocolName:function(){
            var protocolNumber=this.get('protocol');
            var label = 'Any';
            switch (protocolNumber)
            {
                case '1': label = "ICMP";break;
                case '2': label = "IGMP";break;
                case '6': label = "TCP";break;
                case '17': label = "UDP";break;
                case '132': label = "SCTP";break;
                case '51': label = "AH";break;
                case '117': label = "ATP";break;
                case '33': label = "DCCP";break;
                case '88': label = "EIGRP";break;
                case '8': label = "EGP";break;
                case '50': label = "ESP";break;
                case '133': label = "FC";break;
                case '47': label = "GRE";break;
                case '9': label = "IGP";break;
                case '40': label = "IL";break;
                case '115': label = "L2TP";break;
                case '56': label = "TLSP";break;
                case '136': label = "UDPLite";break;
                case '55': label = "MOBILE";break;
                case '137': label = "MPLS-in-IP";break;
                case '84': label = "TTP";break;
                case '70': label = "VISA";break;
                default: label = "Any";break;
            }
            return label;
        }.property('protocol')


});

AccCriteria.url = '/apps/accounting/AccCriteria/';
AccCriteria.primaryKey = 'id';

export default AccCriteria;



