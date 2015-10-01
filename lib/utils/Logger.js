var Bunyan = require('bunyan');
var BunyanFormat = require('bunyan-format');

var LoggerConfig = {
    STREAMS: [{
        level: "warn",
        type: "stream",
        stream: process.stdout
    }]
};

var streams = LoggerConfig.STREAMS.map(function (streamConf) {
    return {
        stream: BunyanFormat({outputMode: 'short'}, streamConf.stream),
        level: streamConf.level
    };
});

module.exports = new Bunyan({
    name: "Electrolyte",
    streams: streams
});