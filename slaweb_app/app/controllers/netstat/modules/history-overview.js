import NetstatBaseModuleWithChartController from '../base-module-with-chart';

var HistoryOverviewController = NetstatBaseModuleWithChartController.extend({

    minTickSize: [1, 'day'],

    sideBySideBars: {
        show: true,
        combinedWidth: moment.duration(0.8, 'days').valueOf()
    },

    afterLoadData: function(data) {
        this._super(data);

        this.set('data', [
            {
                data: data.data.response.maximumDownload,
                label: 'Maximum download',
                label_sk: 'Maximálny download',
                lines: {
                    show: false
                },
                bars: {
                    show: true,
                    align: 'center'
                }
            },
            {
                data: data.data.response.maximumUpload,
                label: 'Maximum upload',
                label_sk: 'Maximálny upload',
                lines: {
                    show: false
                },
                bars: {
                    show: true,
                    align: 'center'
                }
            },
            {
                data: data.data.response.averageDownload,
                label: 'Average download',
                label_sk: 'Priemerný download',
                lines: {
                    show: false
                },
                bars: {
                    show: true,
                    align: 'center'
                }
            },
            {
                data: data.data.response.averageUpload,
                label: 'Average upload',
                label_sk: 'Priemerný upload',
                lines: {
                    show: false
                },
                bars: {
                    show: true,
                    align: 'center'
                }
            }
        ]);
    }

});

export default HistoryOverviewController;