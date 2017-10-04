/**
 * Renders the specified data as a BarChart using the specified element. The data is expected to
 * be a JSON object in the style of {date: <date>; value: <value>}.
 */

const $ = require('jquery');
const d3array = require('d3-array');
const d3axis = require('d3-axis');
const d3scale = require('d3-scale');
const d3time = require('d3-time');

module.exports = {
  render: function (canvas, bins, width, height, xScale, yScale, yValues, extraClasses) {

    // Add a container for this rendering.
    const container = canvas
      .append('g')
      .attr('class', `graph ${extraClasses}`);

    // Append the bar rectangles to the svg element.
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
        return xScale(bin.x1) - xScale(bin.x0) - 1;
      })
      .attr('height', function (bin, index, array) {
        return height - yScale(yValues[index]);
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
