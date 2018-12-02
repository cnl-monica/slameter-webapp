var bytesIn = {
    KB : 1024,
    MB : 1024 * 1024,
    GB : 1024 * 1024 * 1024,
    TB : 1024 * 1024 * 1024 * 1024,
    PB : 1024 * 1024 * 1024 * 1024 * 1024
};

var bpsIn = {
    kbps : 1000,
    Mbps : 1000 * 1000,
    Gbps : 1000 * 1000 * 1000,
    Tbps : 1000 * 1000 * 1000 * 1000,
    Pbps: 1000 * 1000 * 1000 * 1000 * 1000
};

var bytesTo = (function(){
    var defDecimalCount = 2,
        unit = ['B','KB','MB','GB','TB','PB'],
        conv = function(value, convBase, decimalCount){
            if (convBase && convBase%1024 === 0){
                return (value/convBase).toFixed(decimalCount || defDecimalCount) + unit[Math.floor(Math.log(convBase)/Math.log(1024))];
            } else {
                if(value === 0){
                    return '0 B';
                } else {
                    var pow = Math.floor(Math.log(convBase || value)/Math.log(1024)),
                        res = value / Math.pow(1024,pow);
                    return res.toFixed(decimalCount || defDecimalCount).replace(/\D?0+$/, "") + ' ' +unit[pow];
                }
            }
        };

    return {
        auto: function(value, decimalCount) {
            return conv(value, null, decimalCount);
        },
        KB: function(value, decimalCount){
            return conv(value, bytesIn.KB, decimalCount);
        },
        MB: function(value, decimalCount){
            return conv(value, bytesIn.MB, decimalCount);
        },
        GB: function(value, decimalCount){
            return conv(value, bytesIn.GB, decimalCount);
        },
        TB: function(value, decimalCount){
            return conv(value, bytesIn.TB, decimalCount);
        },
        PB: function(value, decimalCount){
            return conv(value, bytesIn.PB, decimalCount);
        }
    };
}());


var bpsTo = (function(){
    var defDecimalCount = 2,
        unit = ['bps','Kbps','Mbps','Gbps','Tbps','Pbps'],
        conv = function(value, convBase, decimalCount){
            if (convBase && convBase%1000 === 0){
                return (value/convBase).toFixed(decimalCount || defDecimalCount) + unit[Math.floor(Math.log(convBase)/Math.log(1000))];
            } else {
                if(value === 0){
                    return '0 bps';
                } else {
                    var pow = Math.floor(Math.log(convBase || value)/Math.log(1000)),
                        res = value / Math.pow(1000,pow);
                    return res.toFixed(decimalCount || defDecimalCount).replace(/\D?0+$/, "") + ' ' +unit[pow];
                }
            }
        };

    return {
        auto: function(value, decimalCount) {
            return conv(value, null, decimalCount);
        },
        kbps: function(value, decimalCount){
            return conv(value, bytesIn.kbps, decimalCount);
        },
        Mbps: function(value, decimalCount){
            return conv(value, bytesIn.Mbps, decimalCount);
        },
        Gbps: function(value, decimalCount){
            return conv(value, bytesIn.Gbps, decimalCount);
        },
        Tbps: function(value, decimalCount){
            return conv(value, bytesIn.Tbps, decimalCount);
        },
        Pbps: function(value, decimalCount){
            return conv(value, bytesIn.Pbps, decimalCount);
        }
    };
}());

export {bytesIn, bytesTo, bpsIn, bpsTo};