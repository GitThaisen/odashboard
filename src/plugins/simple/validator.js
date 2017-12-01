var _ = require('lodash');
var assert = require('assert');
var util = require('util');

function validateDatasource(datasource) {
  assert(datasource.url != undefined,
    util.format('Missing url for simple datasource with id = %s', datasource.id));
}

function shouldHaveDatasourceId(widget) {
  assert(widget.datasourceId != undefined,
    util.format('DatasourceId not defined for datasource with id %s', widget.plugin));

  if (_.find(widget.datasourceId) == undefined) {
    console.log(util.format('Warning: Unknown datasource %s in client config', widget.datasourceId));
  }
}

function validateWidget(widget) {
  shouldHaveDatasourceId(widget);

  assert(widget.displayName != undefined,
    util.format('Missing displayName for Simple widget with datasource id = %s', widget.datasourceId));
  assert(widget.fieldName != undefined,
    util.format('Missing fieldName for Simple widget with datasource id = %s', widget.datasourceId));
  assert(widget.fieldType != undefined,
    util.format('Missing fieldType for Simple widget with datasource id = %s', widget.datasourceId));
}

var exports = module.exports = {};
exports.validateDatasource = validateDatasource;
exports.validateWidget = validateWidget;
