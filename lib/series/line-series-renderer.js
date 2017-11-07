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
  constructor() {

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
  render(bins, xScale, yScale, yValues, extraClasses) {

    // Add a container for this rendering.
    const container = this._canvas
      .append('g')
      .attr('class', `graph ${extraClasses}`);

    // Append the dots to the chart. Note that 'selectAll(dot)' is not expected to select anything,
    // and the '.data().enter().append(circle)' creates the circle elements.
    container.selectAll('dot')
      .data(bins)
      .enter().append('circle')
      .attr('r', RADIUS)
      .attr('cx', function (bin, index, array) {
        return (xScale(bin.x0) + xScale(bin.x1)) / 2;
      })
      .attr('cy', function (bin, index, array) {
        return yScale(yValues[index]);
      });

    // define the line
    var valueline = d3shape.line()
      .curve(d3shape.curveBasis)
      .x(function (bin, index, array) {
        return (xScale(bin.x0) + xScale(bin.x1)) / 2;
      })
      .y(function (bin, index, array) {
        return yScale(yValues[index]);
      });

    // Add the valueline path.
    container.append("path")
      .data([bins])
      .attr("class", "line")
      .attr("d", valueline);

  }

};