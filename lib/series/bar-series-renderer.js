const d3select = require('d3-selection');

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
  constructor(options) {

    this._options = options || {};

    this._options.values = this._options.values || {};
    this._options.values.decimals = this._options.values.decimals || 0;
    this._options.values.rotated = !!this._options.values.rotated;

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
  render(rendererCount, rendererIndex, bins, xScale, yScale, yValues, extraClasses) {

    const options = this._options;

    // Declare some calculation functions that can be used in different places.
    const calculateWidth = function(bin, index, array) {
      // Leave an additional 1 pixel width per bar.
      const barWidth = xScale(bin.x1) - xScale(bin.x0) - 5;
      if (options.supportMultipleBars) {
        return barWidth / rendererCount;
      } else {
        return barWidth;
      }
    };

    // Add a container for this rendering.
    const container = this._canvas
      .append('g')
      .attr('class', `bar-series ${extraClasses}`);

    // Append the bar rectangles to the svg element.
    const _canvasHeight = this._canvasHeight;
    let bar = container.selectAll('.bar')
      .data(bins)
      .enter().append('g');

    bar
      .attr('class', 'bar')
      .attr('transform', function (bin, index, array) {
        let xPos = xScale(bin.x0);
        if (options.supportMultipleBars) {
          xPos += (rendererIndex * calculateWidth(bin, index, array));
        }
        return 'translate(' + xPos + ',' + yScale(yValues[index]) + ')';
        // return 'translate(' + xScale(bin.x0) + ',' + yScale(yValues[index]) + ')';
      });
    bar
      .append('rect')
      .attr('x', 1)
      .attr('width', function (bin, index, array) {
        return calculateWidth(bin, index, array);
      })
      .attr('height', function (bin, index, array) {
        return _canvasHeight - yScale(yValues[index]);
      });

    const text = bar
      .append('text')
      .text(function (bin, index, array) {
        const value = yValues[index];
        const multiplier = Math.pow(10, options.values.decimals);
        return (Number.isNaN(value) ? 0 : Math.round(value * multiplier) / multiplier);
        // const floor = Math.floor(yValues[index]);
        // return (Number.isNaN(floor) ? 0 : floor);
      });
    if (options.values.rotated) {
      text
        .attr('dx', '0')
        .attr('dy', '2')
        .attr('x', 6)
        .attr('y', function (bin, index, array) {
          return - calculateWidth(bin, index, array) / 2;
        })
        .attr('text-anchor', 'start')
        .attr('transform', function() {
          return 'rotate(90)';
        });
    } else {
      text
        .attr('dx', '0')
        .attr('dy', '.75em')
        .attr('y', 6)
        .attr('x', function (bin, index, array) {
          return calculateWidth(bin, index, array) / 2;
        })
        .attr('text-anchor', 'middle')
    }

  }

}
