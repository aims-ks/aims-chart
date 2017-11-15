/**
 * Class for rendering a data as lines/points (eg: 'Line chart').
 *
 * Renders the specified data as a LineChart using the specified element. The data is expected to
 * be a JSON object in the style of {date: <date>; value: <value>}.
 */

const d3shape = require('d3-shape');

const RADIUS = 5;

module.exports = class LineSeriesRenderer {

  /**
   * Constructor to initialise the object.
   */
  constructor(options) {

    this._options = options || {};

    this._options.values = this._options.values || {};
    this._options.values.decimals = this._options.values.decimals || 0;

    // The `canvas` on which to render the bar series. See `setCanvas()`.
    this._canvas = null;

    // The height available on which to render.
    this._canvasHeight = 0;

    // The width available on which to render.
    this._canvasWidth = 0;

  }

  /**
   * Setter method for {@link #_canvas} property.
   */
  setCanvas(canvas) {
    this._canvas = canvas;
  }

  /**
   * Setter method for {@link #_canvasHeight} property.
   */
  setCanvasHeight(height) {
    this._canvasHeight = height;
  }

  /**
   * Setter method for {@link #_canvasWidth} property.
   */
  setCanvasWidth(width) {
    this._canvasWidth = width;
  }

  /**
   * Render the line series.
   *
   * @param bins
   * @param xScale
   * @param yScale
   * @param yValues
   * @param extraClasses
   */
  render(rendererCount, rendererIndex, bins, xScale, yScale, yValues, extraClasses) {

    const options = this._options;

    // Add a container for this rendering.
    const container = this._canvas
      .append('g')
      .attr('class', `line-series ${extraClasses}`);

    // Define the line
    const line = d3shape.line()
    // .curve(d3shape.curveBasis)
      .x(function (bin, index, array) {
        return xScale(bin.x0);
      })
      .y(function (bin, index, array) {
        return yScale(yValues[index]);
      });

    // Add the valueline path.
    container.append("path")
      .data([bins])
      .attr("class", "line")
      .attr("d", line);

    const label = container.selectAll('.label')
      .data(bins)
      .enter().append('g')
      .attr('class', 'label')
      .attr('transform', function(bin, index, array) {
        return 'translate(' + xScale(bin.x0) + ',' + yScale(yValues[index]) + ')';
      });
    label.append('text')
      .attr('dx', '0.5em')
      .attr('dy', '1.0em')
      .text(function(bin, index, array) {
        const value = yValues[index];
        const multiplier = Math.pow(10, options.values.decimals);
        return (Number.isNaN(value) ? 0 : Math.round(value * multiplier) / multiplier);
      });
    label.append('circle')
      .attr('r', RADIUS)
      .attr('cx', 0)
      .attr('cy', 0);
  }

};