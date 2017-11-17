const d3array = require('d3-array');
const d3axis = require('d3-axis');
const d3scale = require('d3-scale');
const d3select = require('d3-selection');
const d3time = require('d3-time');

const LineChartRenderer = require('./series/line-series-renderer');
const XAxisRenderer = require('./x-axis/x-axis-renderer');

/**
 * A class for rendering a D3 chart with basic functionality and settings.
 */
module.exports = class BasicChartView {

  /**
   * Constructor to prepare the Chart.
   *
   * @param options {object} [mandatory] Configuration options for rendering the chart.
   * @param options.target {string} [optional] The element ID in which to render the Chart. Default
   * value is `svg#chart`.
   * @param options.margin.top {int} [optional] The margin to apply to the top of the chart.
   * Default value is `10`.
   * @param options.margin.right {int} [optional] The margin to apply to the right of the chart.
   * Default value is `30`.
   * @param options.margin.bottom {int} [optional] The margin to apply to the bottom of the chart.
   * Default value is `30`.
   * @param options.margin.left {int} [optional] The margin to apply to the left of the chart.
   * Default value is `30`.
   * @param options.xAxis.tickScale {function} [optional] A function to be used when building the
   * histogram to calculate the ticks on the axis. This should be a value from d3Time. Default
   * value is `d3.timeYear`.
   * @param options.yAxis.single {boolean} [optional] Flag that determines if a single y-axis is
   * to be displayed, or a separate y-axis for each dataset. Default value is `true`.
   * @param options.dataSeries {array of objects} [mandatory] Details the data to be rendered. See
   * below for details.
   * 
   * <b>dataSeries</b>
   * - <i>model</i> {aimsModel.BasicModel} [mandatory] Model containing the data of the series to 
   * be rendered. Note that the data should be re-rendered if this Model fires a `Change` event.
   * - </i>renderer</i> {object} [optional] A Renderer implementation class to use to render the 
   * data. Default is `LineChartRenderer`.
   * - <i>cssClasses</i> {string} [optional] Value to assign as CSS class to renderered data. 
   * Default value is empty.
   */
  constructor(options) {

    // Capture the references.
    this._options = options;

    // Perform validation of configuration information.
    this._options = this._options || {};

    this._options.target = 'svg#chart';

    this._options.margin = this._options.margin || {};
    this._options.margin.top = this._options.margin.top || 10;
    this._options.margin.right = this._options.margin.right || 30;
    this._options.margin.bottom = this._options.margin.bottom || 30;
    this._options.margin.left = this._options.margin.left || 30;

    this._options.xAxis = this._options.xAxis || {};
    this._options.xAxis.renderer = this._options.xAxis.renderer || new XAxisRenderer();
    this._options.xAxis.tickScale = this._options.xAxis.tickScale || d3time.timeYear;

    this._options.yAxis = this._options.yAxis || {};
    this._options.yAxis.single = (this._options.yAxis.single !== undefined ?
      this._options.yAxis.single : true);

    if (this._options.dataSeries.length < 1) {
      throw 'Data series not defined.';
    }
    this._options.dataSeries.forEach((_dataSeries) => {
      if (!_dataSeries.model) {
        throw 'Model not defined.';
      }
      _dataSeries.model.on(_dataSeries.model.EVENT_DATA_CHANGED, this._handleDataChange.bind(this));
      if (!_dataSeries.renderer) {
        _dataSeries.renderer = new LineSeriesRenderer();
      }
      _dataSeries.cssClasses = _dataSeries.cssClasses || '';
    }, this);

    // Prepare the `canvas`, which is a container that will group all elements together.
    this._svgChart = d3select.select(this._options.target);
    const _elWidth = Number(this._svgChart.style('width').replace('px', ''));
    const _elHeight = Number(this._svgChart.style('height').replace('px', ''));
    this._canvasWidth = _elWidth - this._options.margin.left - this._options.margin.right;
    this._canvasHeight = _elHeight - this._options.margin.top - this._options.margin.bottom;
    this._canvas = this._svgChart
        .append('g')
        .attr('class', 'canvas')
        .attr('transform',
          'translate(' + this._options.margin.left + ',' + this._options.margin.top + ')');

    // Provide canvas references to the renderers.
    this._options.dataSeries.forEach((_dataSeries) => {
      _dataSeries.renderer.setCanvas(this._canvas);
      _dataSeries.renderer.setCanvasHeight(this._canvasHeight);
      _dataSeries.renderer.setCanvasWidth(this._canvasWidth);
    }, this);

  }

  /**
   * Handler invoked when the chart data changes. Transform the dataModels into chart readable x,y
   * data, ignoring any object(s) that have missing data.
   */
  _handleDataChange() {
    // Do not render if any of the dataModels are completely empty.
    const isEmpty = this._options.dataSeries.some((_dataSeries) => {
      return _dataSeries.model.getData().length === 0;
    });
    if (!isEmpty) {
      const modelData = this._options.dataSeries.map((_dataSeries) => {
        return _dataSeries.model.getData()
          .filter(function (d) {
            return !Number.isNaN(d.x) && !Number.isNaN(d.y);
          });
      });
      this._render(modelData);
    }
  }

  /**
   * Render the specified dataModels. These should be positional matches for the corresponding
   * `cssClass` and `renderer` set in `options`.
   *
   * @param dataModels {array} An array of data objects, where each object represents a single data
   * point, and each array represents a separate model (collection of data).
   */
  _render(modelData) {

    // Clear the existing canvas.
    this._canvas.selectAll('g').remove();

    // Use ALL data to initialise the X and Y axis on the chart.
    const _allData = d3array.merge(modelData);
    if (_allData.length > 0) {

      const _allXValues = _allData.map(function (d) { return d.x; });

      // Calculate the range for the x-axis. If the upper and lower are the same, add a tick margin.
      const xAxisExtent = d3array.extent(_allXValues);
      let lowerDate = xAxisExtent[0];
      let upperDate = xAxisExtent[1];
      if (lowerDate.getTime() === upperDate.getTime()) {
        lowerDate = this._options.xAxis.tickScale.offset(lowerDate, -1);
        upperDate = this._options.xAxis.tickScale.offset(upperDate, 1);
      }
      // Build a scalar (xScale) and histogram (for data chunking) to handle data on the x-axis.
      // This requires considering ALL x data.
      const xScale = d3scale.scaleUtc()
        .domain([lowerDate, upperDate])
        .rangeRound([0, this._canvasWidth]);
      const histogram = d3array.histogram()
        .value(function (d) { return d.x; })
        .domain(xScale.domain())
        .thresholds(xScale.ticks(this._options.xAxis.tickScale));

      // Add the x Axis to the canvas.
      this._options.xAxis.renderer.render(this._canvas, this._canvasHeight, xScale);

      // Calculate the range of Y values. This is necessary to build the y-axis, which we will do
      // next.
      let yValues = [];
      let index = 0;
      modelData.forEach(function(model) {
        if (model.length > 0) {
          const bins = histogram(model);

          // Remove any empty bins at the beginning and end.
          while (bins.length > 0 && bins[0].length == 0) {
            bins.shift();
          }
          while (bins.length > 0 && bins[bins.length - 1].length == 0) {
            bins.pop();
          }

          const means = bins.map(function (bin) {
            return d3array.mean(bin, function (d) {
              return d.y;
            }) || 0; // Zero if no values in bin.
          });
          yValues[index] = {
            bins: bins,
            means: means
          };
          index++;
        }
      }, this);

      // Single y-axis or one for each dataset?
      if (this._options.yAxis.single) {

        // Single y-axis, so build a single Y-axis.
        const combinedMeans = d3array.merge(yValues.map(function(yValue) {
          return yValue.means;
        }));
        const minYvalue = d3array.min(combinedMeans);
        const maxYvalue = d3array.max(combinedMeans);
        const yScale = d3scale.scaleLinear()
          .range([this._canvasHeight, 0])
          .domain([
            minYvalue,
            maxYvalue
          ]);
        this._canvas.append('g')
          .attr('class', 'y-axis')
          .call(d3axis.axisLeft(yScale));

        // Render the data.
        index = 0;
        yValues.forEach(function(yValue) {
          const cssClass = this._options.dataSeries[index].cssClasses;
          const renderer = this._options.dataSeries[index].renderer;

          const selectedBins = [];
          renderer.render(yValues.length, index, yValue.bins, xScale, yScale, yValue.means, cssClass);
          index++;
        }, this);

      } else {

        // Multiple y-axis.
        index = 0;
        yValues.forEach(function(yValue) {

          // Find minimum and maximum values for the model.
          const minYvalue = d3array.min(yValue.means);
          const maxYvalue = d3array.max(yValue.means);

          // Calculate the scale and add the axis to the canvas.
          const yScale = d3scale.scaleLinear()
            .range([this._canvasHeight, 0])
            .domain([minYvalue, maxYvalue]);
          const cssClass = 'y-axis ' + this._options.dataSeries[index].cssClasses;
          const renderer = this._options.dataSeries[index].renderer;
          this._canvas.append('g')
            .attr('class', cssClass)
            .call(d3axis.axisLeft(yScale));

          // Render the data.
          const selectedBins = [];
          renderer.render(yValues.length, index, yValue.bins, xScale, yScale, yValue.means, cssClass);

          index++;
        }, this);

      }
    }
  };

};
