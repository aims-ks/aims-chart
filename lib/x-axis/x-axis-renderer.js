const d3axis = require('d3-axis');

/**
 * Class for rendering the X-axis.
 */
module.exports = class XAxisRenderer {

  /**
   * Render the bar series.
   *
   * @param bins
   * @param xScale
   * @param yScale
   * @param yValues
   * @param extraClasses
   */
  render(canvas, canvasHeight, xScale) {
    canvas.append('g')
      .attr('class', 'x-axis')
      .attr('transform', 'translate(0,' + canvasHeight + ')')
      .call(d3axis.axisBottom(xScale));
  }

};
