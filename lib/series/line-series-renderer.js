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
   * Constructor to capture any options.
   */
  constructor(index, options, canvas, canvasWidth, canvasHeight) {
    this._index = index;
    this._canvas = canvas;
    this._canvasWidth = canvasWidth;
    this._canvasHeight = canvasHeight;

    this._options = options || {};
  }

  /**
   * Render the data as a line.
   */
  render(bins, xScale, yScale) {

    const _options = this._options;

    // Add a container for this rendering.
    const container = this._canvas
      .append('g')
      .attr('class', 'line-series');

    // Define the line
    const line = d3shape.line()
      .x(function (bin, index, array) {
        return xScale(bin.x0);
      })
      .y(function (bin, index, array) {
        return yScale(bin.mean);
      });

    // Add the valueline path.
    const path = container.append('path')
      .data([bins])
      .attr('class', 'line')
      .attr('d', line);
    if (this._options.line.stroke) {
      path.attr('stroke', this._options.line.stroke);
    }

    const dataPoint = container.selectAll('.data-point')
      .data(bins)
      .enter().append('g')
      .attr('class', 'data-point')
      .attr('transform', function(bin, index, array) {
        return 'translate(' + xScale(bin.x0) + ',' + yScale(bin.mean) + ')';
      });

    // Display the value.
    if (_options.values) {
      dataPoint.append('text')
        .attr('dx', '0.5em')
        .attr('dy', '1.0em')
        .text(function (bin, index, array) {
          const value = bin.mean;
          const decimals = (_options.values.decimals ? _options.values.decimals : 0);
          const multiplier = Math.pow(10, decimals);
          return (Number.isNaN(value) ? 0 : Math.round(value * multiplier) / multiplier);
        });
    }

    // Display the marker.
    if (_options.marker) {
      const marker = dataPoint.append(_options.marker.type)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', _options.marker.fill);

      if (_options.marker.type === 'circle') {
        marker.attr('r', _options.marker.radius);
      }

    }
  }

};