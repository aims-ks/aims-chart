/**
 * Renders the specified data as a LineChart using the specified element. The data is expected to
 * be a JSON object in the style of {date: <date>; value: <value>}.
 */

const d3select = require('d3-selection');
const d3shape = require('d3-shape');

const RADIUS = 5;

export function render(canvas, bins, xScale, yScale, yValues, extraClasses) {

  // Add a container for this rendering.
  const container = canvas
    .append('g')
    .attr('class', `graph ${extraClasses}`);

  // Append the dots to the chart. Note that 'selectAll(dot)' is not expected to select anything,
  // and the '.data().enter().append(circle)' creates the circle elements.
  container.selectAll('dot')
    .data(bins)
    .enter().append('circle')
    .attr('r', RADIUS)
    .attr('cx', function(bin, index, array) {
      return xScale(bin.x0);
    })
    .attr('cy', function(bin, index, array) {
      return yScale(yValues[index]);
    });

  // define the line
  var valueline = d3shape.line()
    .curve(d3shape.curveBasis)
    .x(function(bin, index, array) {
      return xScale(bin.x0);
    })
    .y(function(bin, index, array) {
      return yScale(yValues[index]);
    });

  // Add the valueline path.
  container.append("path")
    .data([bins])
    .attr("class", "line")
    .attr("d", valueline);

};

