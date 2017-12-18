const d3axis = require('d3-axis');

/**
 * Class for rendering the Y-axis.
 */
module.exports = class YAxisRenderer {

  /**
   * Constructor to capture any options.
   */
  constructor(canvas, canvasWidth, canvasHeight, options) {
    this._canvas = canvas;
    this._canvasWidth = canvasWidth;
    this._canvasHeight = canvasHeight;

    this._options = options || {};

    this._options.grid = this._options.grid || {};
    // If 'show' is not specified, set to 'true' if any properties have been set.
    if (this._options.grid.show === undefined) {
      this._options.grid.show = Object.keys(this._options.grid).length > 0;
    }

  }

  /**
   * Render the y-axis.
   */
  render(yScale) {

    // Add the y-axis element.
    const yAxisElement = this._canvas.append('g')
      .attr('class', 'y-axis');

    // Add the label.
    if (this._options && this._options.title && this._options.title.text) {
      const label = yAxisElement
        .append('text')
        .attr('class', 'yAxisLabel')
        .attr('transform', 'rotate(-90)')
        .attr('x', -yScale.range()[0]/2)
        .attr('y', -25)
        .attr('text-anchor', 'middle');
      if (this._options.title.text instanceof Function) {
        label.text(this._options.title.text.call());
      } else {
        label.text(this._options.title.text);
      }
    }

    // Instantiate the y-axis at the left of the chart.
    const yAxis = d3axis.axisLeft(yScale);

    // Add grid lines if enabled.
    if (this._options.grid.show) {
      yAxis
        .tickSizeInner(-this._canvasWidth);
    }

    // Apply the y-axis to the element.
    yAxisElement.call(yAxis);

    // Perform any custom styling.
    if (this._options.grid.show) {
      if (this._options.grid.stroke) {
        yAxisElement.selectAll(".tick line")
          .attr("stroke", this._options.grid.stroke)
          .attr("stroke-dasharray", "2,2");
      }
    }

  }

};
