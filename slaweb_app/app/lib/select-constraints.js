var cmp_users = {
        calcTypeSelect: [
            {val:'named', label: 'Named Time Period'},
            {val:'relative', label: 'Relative Time Period'},
            {val:'absolete', label: 'Absolute Time Period'}
        ],

        namedSelect: [
            {val:'last_hour', label: 'Last Hour'},
            {val:'last_day', label: 'Last Day'},
            {val:'today', label: 'Today'},
            {val:'last_month', label: 'Last Month'},
            {val:'last3m', label:'Last 3 Months'}
        ],

        relativeSelect: [
            {val:'hours', label: 'Hours'},
            {val:'days', label: 'Days'},
            {val:'months', label: 'Months'}
        ]

};

var criter_eval_form = {
        hour_select: [
        {val:'0', label: '00:00'},
        {val:'1', label: '01:00'},
        {val:'2', label: '02:00'},
        {val: '3', label: '03:00'},
        {val: '4', label: '04:00'},
        {val:'5', label: '05:00'},
        {val:'6', label: '06:00'},
        {val: '7', label: '07:00'},
        {val: '8', label:'08:00'},
        {val:'9', label: '09:00'},
        {val:'10', label: '10:00'},
        {val:'11',label:'11:00'},
        {val: '12',label: '12:00'},
        {val:'13', label: '13:00'},
        {val:'14', label:  '14:00'},
        {val: '15', label: '15:00'},
        {val: '16', label: '16:00'},
        {val:'17', label: '17:00'},
        {val:'18', label: '18:00'},
        {val:'19', label: '19:00'},
        {val:'20', label: '20:00'},
        {val:'21', label: '21:00'},
        {val:'22', label: '22:00'},
        {val:'23', label: '23:00'}
        ],
        calcTypeSelect: [
            {val:'named', label: 'Named Time Period'},
            {val:'relative', label: 'Relative Time Period'},
            {val:'absolete', label: 'Absolute Time Period'}
        ],

        namedSelect: [
            {val:'last_day', label: 'Last Day'},
            {val:'today', label: 'Today'},
            {val:'last_month', label: 'Last Month'},
            {val:'last3m', label:'Last 3 Months'}
        ],

        relativeSelect: [
            {val:'days', label: 'Days'},
            {val:'months', label: 'Months'}
        ]
};


var speed_basic_constraints = {
    calcTypeSelect: [
        {
            val: 'in_out_merged',
            label: 'IN & OUT Merged',
            desc_speed: 'Take the sum(IN, OUT) for each interval and then calculate 95th percentile value from the merged records'
        },
        {
            val: 'in_out_sep_final',
            label: 'IN & OUT Separate Final',
            desc_speed: 'Calculate the 95th percentile value of IN and 95th percentile value of OUT and then take the maximum of those two values'
        },
        {
            val: 'in_out_sep_each',
            label: 'IN & OUT Separate Each',
            desc_speed: 'Take the max(IN, OUT) for each interval and then calculate 95th percentile value'
        }
    ],
    desc_speed: 'Take the sum(IN, OUT) for each interval and then calculate 95th percentile value from the merged records',
    billTypeSelect: [
        {val:'speed', label: 'Speed'},
        {val:'volume', label:'Volume'}
    ],
    unit: [
        {val:1 ,label:'bps'},
        {val:1000, label:'Kbps'},
        {val:1000*1000, label:'Mbps'},
        {val:1000*1000*1000, label:'Gbps'}
    ],
    calcIntervalSelect: [
        {val:'last_month', label: 'Last Month'},
        {val:'last3m', label:'Last 3 Months'},
        {val: 'absolete', label: 'Selected interval'}
    ]
};

var volume_basic_constraints = {
    calcTypeSelect: [
        {
            val: 'up_down_load',
            label: 'UPLOAD & DOWNLOAD',
            desc_volume: 'Total costs will be calculated by combining both upload and download data transfer'
        },
        {
            val: 'download',
            label: 'DOWNLOAD',
            desc_volume: 'Total costs will be calculated only by downloaded data'},
        {
            val: 'upload',
            label: 'UPLOAD',
            desc_volume: 'Total costs will be calculated only by uploaded data'}
    ],
    desc_volume:'Total costs will be calculated by combining both upload and download data transfer',
    calcIntervalSelect: [
        {val:'last_month', label: 'Last Month'},
        {val:'last3m', label:'Last 3 Months'},
        {val: 'absolete', label: 'Selected interval'}
    ],
    unit: [
        {val:1, label:'B'},
        {val:1024, label:'KB'},
        {val:1024*1024, label:'MB'},
        {val:1024*1024*1024, label:'GB'}
    ]
};

var criteria_form = {
    multicastSelect: [
        {label: "Any", val: false},
        {label: "Only", val: true}
    ],
    protocolSelect: [
        {val:'any', label: 'ANY'},
        {val:'6', label: 'TCP'},
        {val:'17', label: 'UDP'},
        {val: '132', label: 'SCTP'},
        {val: '1', label: 'ICMP'},
        {val:'2', label: 'IGMP'},
        {val:'51', label: 'AH'},
        {val: '117', label: 'ATP'},
        {val: '33', label:'DCCP'},
        {val:'88', label: 'EIGRP'},
        {val:'8', label: 'EGP'},
        {val:'50',label:'ESP'},
        {val: '133',label: 'FC'},
        {val:'47', label: 'GRE'},
        {val:'9', label:  'IGP'},
        {val: '40', label: 'IL'},
        {val: '115', label: 'L2TP'},
        {val:'56', label: 'TLSP'},
        {val:'136', label: 'UDPLite'},
        {val:'55', label: 'MOBILE'},
        {val:'137', label: 'MPLS-in-IP'},
        {val:'84', label: 'TTP'},
        {val:'70', label: 'VISA'}
    ]
};

var bill_plans_constraints = {

      billTypeSelect: [
            {val:'Speed', label: 'Speed'},
            {val:'Volume', label: 'Volume'},
            {val: 'Criteria', label: 'Criteria'}
    ],
    generationPeriodSelect: [
        {val:'1', label: 'Monthly'},
        {val:'3', label: 'Quarterly'}
    ],
    generationDateSelect: [
            {val:1, label: '1'},
            {val:2, label: '2'},
            {val:3, label: '3'},
            {val:4, label: '4'},
            {val:5, label: '5'},
            {val:6, label: '6'},
            {val:7, label: '7'},
            {val:8, label: '8'},
            {val:9, label: '9'},
            {val:10, label: '10'},
            {val:11, label: '11'},
            {val:12, label: '12'},
            {val:13, label: '13'},
            {val:14, label: '14'},
            {val:15, label: '15'},
            {val:16, label: '16'},
            {val:17, label: '17'},
            {val:18, label: '18'},
            {val:19, label: '19'},
            {val:20, label: '20'},
            {val:21, label: '21'},
            {val:22, label: '22'},
            {val:23, label: '23'},
            {val:24, label: '24'},
            {val:25, label: '25'},
            {val:26, label: '26'},
            {val:27, label: '27'}
    ],
    generationMonthsSelect: [
        {val:'1,4,7,10', label:'Jan, Apr, July, Oct'},
        {val:'2,5,8,11', label:'Feb, May, Aug, Nov'},
        {val:'3,6,9,12', label:'Mar, June, Sept, Dec'}
    ]
};



export {cmp_users, criteria_form, criter_eval_form, volume_basic_constraints, speed_basic_constraints, bill_plans_constraints};