/**
 * A View for rendering a basic D3 chart.
 */

const d3array = require('d3-array');
const d3axis = require('d3-axis');
const d3scale = require('d3-scale');
const d3select = require('d3-selection');
const d3time = require('d3-time');

const LineChartRenderer = require('./renderers/line-chart-renderer');

module.exports = class BasicChartView {

  /**
   * Constructor to prepare the Chart.
   *
   * @param options.target {string} The element ID in which to render the Chart. Default value is
   * `svg#chart`.
   * @param options.margin.top {int} The margin to add to the top of the chart. Default value is
   * `10`.
   * @param options.margin.right {int} The margin to add to the right of the chart. Default value
   * is `30`.
   * @param options.margin.bottom {int} The margin to add to the bottom of the chart. Default value
   * is `30`.
   * @param options.margin.left {int} The margin to add to the left of the chart. Default value
   * is `30`.
   * @param options.xAxis.tickScale {function} A function to be used when building the histogram to
   * calculate the ticks on the axis. This should be a value from d3Time. Default value is
   * `d3.timeYear`.
   * @param options.yAxis.single {boolean} Flag that determines if a single y-axis is to be
   * displayed, or a separate y-axis for each dataset. Default value is `true`.
   */
  constructor(options) {

    // Capture the references.
    this._options = options;

    // Set default values for the options if required.
    this._options = this._options || {};

    this._options.margin = this._options.margin || {};
    this._options.margin.top = this._options.margin.top || 10;
    this._options.margin.right = this._options.margin.right || 30;
    this._options.margin.bottom = this._options.margin.bottom || 30;
    this._options.margin.left = this._options.margin.left || 30;

    this._options.xAxis = this._options.xAxis || {};
    this._options.xAxis.tickScale = this._options.xAxis.tickScale || d3time.timeYear;

    this._options.yAxis = this._options.yAxis || {};
    this._options.yAxis.single = (this._options.yAxis.single != undefined ?
      this._options.yAxis.single : true);

    // Capture the reference to the underlying DOM element.
    if (!options.target) {
      throw '"target" not defined in options.';
    }
    this._svgChart = d3select.select(options.target);

  };

  /**
   * Render the specified models. These should be positional matches for the corresponding
   * `cssClass` and `renderer` set in `options`.
   *
   * @param models {array} An array of data objects, where each object represents a single data
   * point, and each array represents a separate model (collection of data).
   * @param dataReader {function} A function to transform a data object to simple value object
   * containing ony x,y information.
   */
  _render(models, dataReader) {

    // Clear the existing chart to leave a blank canvas. By convention, all Renderers add a top
    // level grouping element which margins are applied to. To clear a chart, remove all top level
    // grouping elements.
    this._svgChart.selectAll('g').remove();

    // Calculate the dimensions of the Chart.
    const _elWidth = Number(this._svgChart.style('width').replace('px', ''));
    const _elHeight = Number(this._svgChart.style('height').replace('px', ''));
    const _width = _elWidth - this._options.margin.left - this._options.margin.right;
    const _height = _elHeight - this._options.margin.top - this._options.margin.bottom;

    // Transform the models into chart readable x,y data, ignoring any object that have missing
    // data.
    const _models = models
      .map(function(model) {
        return model
          .map(function(d) { return dataReader(d) }, this)
          .filter(function(d) { return d.x && d.y; });
      });

    // Use ALL data to initialise the X and Y axis on the chart.
    const _allData = d3array.merge(_models);
    if (_allData.length > 0) {

      const _allXValues = _allData.map(function (d) { return d.x; });

      // Add a container, which we will call 'canvas', to group all elements together. This canvas
      // is responsible for introducing the margins that everything else must render within.
      const canvas = this._svgChart
        .append('g')
        .attr('transform',
          'translate(' + this._options.margin.left + ',' + this._options.margin.top + ')');

      // Build a scaler (xScale) and histogram (for data chunking) to handle data on the x-axis. This
      // requires considering ALL x data.
      const xScale = d3scale.scaleTime()
        .domain(d3array.extent(_allXValues))
        .rangeRound([0, _width]);
      const histogram = d3array.histogram()
        .value(function (d) {
          return d.x;
        })
        .domain(xScale.domain())
        .thresholds(xScale.ticks(this._options.xAxis.tickScale));

      // Add the x Axis to the canvas.
      canvas.append('g')
        .attr('transform', 'translate(0,' + _height + ')')
        .call(d3axis.axisBottom(xScale));

      // Calculate the range of Y values. This is necessary to build the y-axis, which we will do
      // next.
      let yValues = [];
      let index = 0;
      _models.forEach(function(model) {
        if (model.length > 0) {
          const bins = histogram(model);
          const means = bins.map(function (bin) {
            return d3array.mean(bin, function (d) {
              return d.y;
            });
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
          .range([_height, 0])
          .domain([minYvalue, maxYvalue]);
        canvas.append('g')
          .call(d3axis.axisLeft(yScale));

        // Render the data.
        index = 0;
        yValues.forEach(function(yValue) {
          const cssClass = (this._options.cssClasses && this._options.cssClasses[index] ?
            this._options.cssClasses[index] : '');
          const renderer = (this._options.renderers && this._options.renderers[index] ?
            this._options.renderers[index] : LineChartRenderer);
          renderer.render(canvas, yValue.bins, _width, _height, xScale, yScale, yValue.means, cssClass);
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
            .range([_height, 0])
            .domain([minYvalue, maxYvalue]);
          const cssClass = (this._options.cssClasses && this._options.cssClasses[index] ?
            this._options.cssClasses[index] : '');
          canvas.append('g')
            .attr('class', cssClass)
            .call(d3axis.axisLeft(yScale));

          // Render the data.
          const renderer = (this._options.renderers && this._options.renderers[index] ?
            this._options.renderers[index] : LineChartRenderer);
          renderer.render(canvas, yValue.bins, _width, _height, xScale, yScale, yValue.means, cssClass);

          index++;
        }, this);

      }
    }
  };

};
