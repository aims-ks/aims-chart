/**
 * Class for rendering a data as bars (eg: 'Bar chart').
 *
 * Renders the specified data as a BarChart using the specified element. The data is expected to
 * be a JSON object in the style of {date: <date>; value: <value>}.
 */

module.exports = class BarSeriesRenderer {

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
   * Render the bar series.
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

    // Append the bar rectangles to the svg element.
    const _canvasHeight = this._canvasHeight;
    let bar = container.selectAll('.bar')
      .data(bins)
      .enter().append('g')
      .attr('class', 'bar')
      .attr('transform', function (bin, index, array) {
        return 'translate(' + xScale(bin.x0) + ',' + yScale(yValues[index]) + ')';
      });
    bar.append('rect')
      .attr('x', 1)
      .attr('width', function (bin, index, array) {
        // Leave an additional 1 pixel width per bar.
        return xScale(bin.x1) - xScale(bin.x0) - 1;
      })
      .attr('height', function (bin, index, array) {
        return _canvasHeight - yScale(yValues[index]);
      });

    bar.append('text')
      .attr('dy', '.75em')
      .attr('y', 6)
      .attr('x', function (bin, index, array) {
        return (xScale(bin.x1) - xScale(bin.x0)) / 2;
      })
      .attr('text-anchor', 'middle')
      .text(function (bin, index, array) {
        const floor = Math.floor(yValues[index]);
        return (Number.isNaN(floor) ? 0 : floor);
      });

  }

}
