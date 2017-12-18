const d3array = require('d3-array');
const d3scale = require('d3-scale');
const d3select = require('d3-selection');
const d3time = require('d3-time');

const LineSeriesRenderer = require('./series/line-series-renderer');
const XAxisRenderer = require('./x-axis/x-axis-renderer');
const YAxisRenderer = require('./y-axis/y-axis-renderer');
const SimpleMouseOverVerticalTooltip = require('./tooltip/simple-mouse-over-vertical');

/**
 * A class for rendering a D3 chart with basic functionality and settings.
 */
module.exports = class LineChart {

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
   * @param options.yAxis.title.text {string or function} [optional] The title to display on the
   * y-axis. If a function, it will be invoked before rendering.
   * @param options.xAxis.title.text {string or function} [optional] The title to display on the
   * x-axis. If a function, it will be invoked before rendering.
   * @param options.xAxis.tickScale {function} [optional] A function to be used when building the
   * histogram to calculate the ticks on the axis. This should be a value from d3Time. Default
   * value is `d3.timeYear`.
   * @param options.xAxis.isSelectable {boolean} [optional] Flag that determines if the user can
   * make selections on the x-axis.
   * @param options.xAxis.title.text {string or function} [optional] The title to display on the
   * x-axis. If a function, it will be invoked before rendering.
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

    this._options.yAxis = this._options.yAxis || {};
    this._options.yAxis.title = this._options.yAxis.title || {};

    // Leave enough space for the y-axis title.
    if (this._options.yAxis.title.text && this._options.margin.left < 40) {
      this._options.margin.left = 40;
    }

    this._options.xAxis = this._options.xAxis || {};
    this._options.xAxis.title = this._options.xAxis.title || {};
    this._options.xAxis.tick = this._options.xAxis.tick || {};
    this._options.xAxis.tick.scale = this._options.xAxis.tick.scale || d3time.timeYear;

    // Leave enough space for the x-axis title.
    if (this._options.xAxis.title.text && this._options.margin.bottom < 40) {
      this._options.margin.bottom = 40;
    }

    if (this._options.dataSeries.length < 1) {
      throw 'Data series not defined.';
    }

    // Prepare the `canvas`, which is a container that will group all elements together.
    this._svgChart = d3select.select(this._options.target);
    const _elWidth = Number(this._svgChart.style('width').replace('px', ''));
    const _elHeight = Number(this._svgChart.style('height').replace('px', ''));
    this._canvasWidth = _elWidth - this._options.margin.left - this._options.margin.right;
    this._canvasHeight = _elHeight - this._options.margin.top - this._options.margin.bottom;
    this._svgChart
      .attr('viewBox' ,`0 0 ${_elWidth} ${_elHeight}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    this._canvas = this._svgChart
        .append('g')
        .attr('class', 'canvas')
        .attr('transform',
          'translate(' + this._options.margin.left + ',' + this._options.margin.top + ')');

    // Instantiate a xAxis renderer for use when rendering the graph.
    // if (this._options.xAxis.onSelectListeners && this._options.xAxis.onSelectListeners.length > 0) {
    //   this.xAxis = new XAxisRendererSelectable(this._canvas, this._canvasWidth, this._canvasHeight,
    //     this._options.xAxis
    //   );
    // } else {
      this.xAxis = new XAxisRenderer(this._canvas, this._canvasWidth, this._canvasHeight,
        this._options.xAxis
      );
    // }

    // Instantiate a yAxis renderer for use when rendering the graph.
    this._yAxisRenderer = new YAxisRenderer(this._canvas, this._canvasWidth, this._canvasHeight,
      this._options.yAxis
    );

    // Instantiate the line renderers and store in the configur
    this._renderers = this._options.dataSeries.map((_options, index) => {
      return new LineSeriesRenderer(index, _options, this._canvas, this._canvasWidth,
        this._canvasHeight);
    });
  }

  /**
   * (Re-)render the chart.
   */
  render() {

    // Clear the existing canvas.
    this._canvas.selectAll('g').remove();

    // Gather the raw data to be rendered. 'rawData' will be an array with the length of the number
    // of 'dataSeries' definitions. Each entry will be an array containing the actual data. If the
    // data is specified as 'source', invoke the source, otherwise capture the data. Remove any
    // data points where the Y-axis is a NaN.
    const rawData = this._options.dataSeries.map(_dataSeries => {
      if (_dataSeries.source) {
        return _dataSeries.source.call();
      } else {
        return _dataSeries.data;
      }
    })
      .filter(_dataSeries => {
        return _dataSeries.map(_dataPoint => {
          return !Number.isNaN(_dataPoint);
        });
      })
    ;

    // Calculate the xAxis 'scale', which is used to construct the 'histogram' (which is in turn
    // used for quite a bit). Note that we can't calculate the yAxis 'scale' yet because we need to
    // group data into 'bins' (done by the 'histogram') and calculate the average Y value for each
    // 'bin' so we can then calculate the yAxis max and min values, which are then used to build
    // the yAxis 'scale'.
    // xAxis 'extent' looks at the x values for ALL data.
    const xAxisExtent = d3array.extent(
      d3array.merge(rawData)
        .map(d => { return d.x; })
    );
    let lowestX = xAxisExtent[0];
    let highestX = xAxisExtent[1];
    if (lowestX === highestX) {
      lowestX = this._options.xAxis.tick.scale.offset(lowestX, -1);
      highestX = this._options.xAxis.tick.scale.offset(highestX, 1);
    }

    // Use the upper and lower bounds to build the scaler for the x-axis.
    const xScale = d3scale.scaleUtc()
      .domain([lowestX, highestX])
      .rangeRound([0, this._canvasWidth]);

    // Render the x-axis.
    this.xAxis.render(xScale);

    // Use the scaler to build the histogram. The scaler is used to determine the bucket size.
    const histogram = d3array.histogram()
      .value(function (d) { return d.x; })
      .domain(xScale.domain())
      .thresholds(xScale.ticks(this._options.xAxis.tick.scale));

    // For each data series, use the 'histogram' to separate the data into bins, based on the 'x'
    // value. For each bin, calculate the mean/average 'y' value for the bin, and capture the
    // maximum value as we go for use in building a y-axis scaler.
    let maxY = undefined;
    const chartData = rawData.map((_data) => {

      // Use the histogram to separate the data into bins.
      const tempBins = histogram(_data);

      // Remove any empty bins.
      const bins = tempBins.filter(bin => { return bin.length !== 0; });

      // Calculate the mean/average Y value for each bin.
      bins.forEach(function (bin) {
        bin.mean = d3array.mean(bin, function (d) {
          return d.y;
        }) || 0; // Zero if no values in bin.
        if (!maxY || bin.mean > maxY) {
          maxY = bin.mean;
        }
      });

      return { bins };
    });

    // Build the y-axis scaler.
    const yScale = d3scale.scaleLinear()
      .range([this._canvasHeight, 0])
      .domain([0, maxY]);

    // Render the y-axis.
    this._yAxisRenderer.render(yScale);

    // Render the data as line series.
    chartData.forEach(function(_chartData, index) {
      this._renderers[index].render(_chartData.bins, xScale, yScale);
      index++;
    }, this);

    if (this._options.mouseOver && this._options.mouseOver.type === 'simple-mouse-over-vertical') {
      new SimpleMouseOverVerticalTooltip(this._options, this._canvas, this._canvasWidth,
        this._canvasHeight, xScale, yScale, chartData);
    }
  }


};
