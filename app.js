var express = require('express');
var _ = require('lodash');
var app = express();
var favicon = require('serve-favicon');
var appConfig = require('./config/appconfig');

var parser = require('./argumentparser');
var args = parser.parseArgs();

/* Load config and validate */
var datasourceconfig;
try {
  datasourceconfig = require(args.datasourceconfig);
} catch (e) {
  console.log('Datasource config not found: ' + args.datasourceconfig);
  process.exit(1);
}

var widgetconfig;
try {
  widgetconfig = require(args.widgetconfig);
} catch (e) {
  console.log('Widget config not found: ' + args.widgetconfig);
  process.exit(1);
}
var configValidator = require('./validators/configValidator');
configValidator.validate(appConfig, widgetconfig, datasourceconfig);

/* Setup express and socket.io */
console.log('Starting application');
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('static'));
app.get('/config/widgetconfig.js', function(req, res) {
  res.send(JSON.stringify(widgetconfig)); 
});
app.use(favicon(__dirname + '/public/img/favicon-alt.ico'));


app.get('/', function(req, res) {
  res.render('layout', {
    plugins: appConfig.enabledPlugins
  });
});

app.get('/test', function(req, res) {
  res.send(JSON.stringify({
    astring: 'Hello world' + Math.round(Math.random() * 100),
    number: Math.round(Math.random() * 100),
    bigNumber: Math.round(Math.random() * 10000),
    boolean: true,
    imgurl: 'https://placeholdit.imgix.net/~text?txtsize=33&txt=350%C3%97150&w=350&h=150',
    piechart: {
      dataset: [Math.round(Math.random() * 50), Math.round(Math.random() * 50), Math.round(Math.random() * 50), Math.round(Math.random() * 50)],
      labels: ['Elephan', 'Mouse', 'Platypus', 'Lol']
    }
  }));
});

console.log('Listening at port ' + (process.env.PORT || args.port));
var server = app.listen(process.env.PORT || args.port);
var io = require('socket.io').listen(server);

/* Plugin definitions */
var activePlugins = [];
_.each(appConfig.enabledPlugins, function(pluginName) {

  app.use('/plugins/' + pluginName, express.static('src/plugins/' + pluginName + '/public'));

  try {
    var pluginServerPath = './src/plugins/' + pluginName + '/server.js';
    var plugin = require(pluginServerPath, function() {});
    activePlugins[pluginName] = plugin;
  } catch (e) {
    console.log('Failed to activate plugin ' + pluginName + '(' + JSON.stringify(e) + ')');
    // continue regardless of error
  }
});

function setDefaults(datasourceDefaults, datasource) {
  _.each(datasourceDefaults, function (defaultValue, key) {
    if (datasource[key] === undefined) {
      datasource[key] = defaultValue;
    }
  });

  return datasource;
}

/* Datasource config and validation */
_.each(datasourceconfig.datasources, function(datasource) {
  var plugin = activePlugins[datasource.plugin];

  if (plugin === undefined) {
    console.log('Plugin ' + plugin + ' not available for datasource: ' + datasource.id);
  } else {
    datasource = setDefaults(appConfig.datasourceDefaults, datasource);
    plugin.initDatasource(datasource, io);
    if (plugin.validate !== undefined) {
      plugin.validate(datasource);
    }
  }
});

io.on('connection', function() {
  console.log('A dashboard connected');
  console.log('Number of connected clients: ' + io.engine.clientsCount);
});
