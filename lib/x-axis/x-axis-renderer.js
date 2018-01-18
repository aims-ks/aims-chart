const d3axis = require('d3-axis');

const SelectableRange = require('./selectable-range');

/**
 * Class for rendering the X-axis.
 */
module.exports = class XAxisRenderer {

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

    if (this._options.onSelectListeners && this._options.onSelectListeners.length > 0) {
      this.selection = new SelectableRange(canvas, canvasWidth, canvasHeight, options);
    }

  }

  /**
   * Render the x-axis.
   */
  render(xScale) {

    // Add the x-axis element.
    const xAxisElement = this._canvas.append('g')
      .attr('class', 'x-axis')
      .attr('transform', 'translate(0,' + this._canvasHeight + ')');

    // Add the title.
    if (this._options && this._options.title && this._options.title.text) {
      const title = xAxisElement
        .append('text')
        .attr('class', 'xAxisTitle')
        .attr('x', xScale.range()[1]/2)
        .attr('y', 35)
        .attr('text-anchor', 'middle')
        .attr('fill', this._options.title.colour)
        .attr('font-size', this._options.title.fontSize);
      if (this._options.title.text instanceof Function) {
        title.text(this._options.title.text.call());
      } else {
        title.text(this._options.title.text);
      }
    }

    // Instantiate the x-axis at the bottom of the chart.
    const xAxis = d3axis.axisBottom(xScale);

    // Add grid lines if enabled.
    if (this._options.grid.show) {
      xAxis
        .tickSizeInner(-this._canvasHeight);
    }

    // Apply the x-axis to the element.
    xAxisElement.call(xAxis);

    // Style the ticks.
    xAxisElement.selectAll('g.tick').select('text')
      .attr('fill', this._options.labels.colour)
      .attr('font-size', this._options.labels.fontSize);

    // Perform any custom styling.
    if (this._options.grid.show) {
      if (this._options.grid.stroke) {
        xAxisElement.selectAll(".tick line")
          .attr("stroke", this._options.grid.stroke)
          .attr("stroke-dasharray", "2,2");
      }
    }

    // Invoke the selectable range renderer if required/defined.
    if (this.selection) {
      this.selection.render(xScale);
    }

  }

};
