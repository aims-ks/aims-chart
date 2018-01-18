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

    this._options.title = this._options.title || {};
    this._options.title.colour = this._options.title.colour|| 'black';
    this._options.title.fontSize = this._options.title.fontSize || '14px';

    this._options.labels = this._options.labels || {};
    this._options.labels.colour = this._options.labels.colour|| 'black';
    this._options.labels.fontSize = this._options.labels.fontSize || '12px';

  }

  /**
   * Render the y-axis.
   */
  render(yScale) {

    // Add the y-axis element.
    const yAxisElement = this._canvas.append('g')
      .attr('class', 'y-axis');

    // Add the title.
    if (this._options && this._options.title && this._options.title.text) {
      const title = yAxisElement
        .append('text')
        .attr('class', 'yAxisTitle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -yScale.range()[0]/2)
        .attr('y', -25)
        .attr('text-anchor', 'middle')
        .attr('fill', this._options.title.colour)
        .attr('font-size', this._options.title.fontSize);
      if (this._options.title.text instanceof Function) {
        title.text(this._options.title.text.call());
      } else {
        title.text(this._options.title.text);
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

    // Style the ticks.
    yAxisElement.selectAll('g.tick').select('text')
      .attr('fill', this._options.labels.colour)
      .attr('font-size', this._options.labels.fontSize);

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
