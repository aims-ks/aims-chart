/**
 * Extends BarSeriesRenderer to allow the user to select one or more bars in the series and fires
 * a `SELECTED` event.
 */

const d3brush = require('d3-brush');
const d3select = require('d3-selection');
const d3time = require('d3-time');

const XAxisRenderer = require('./x-axis-renderer');

module.exports = class SelectableXAxisRenderer extends XAxisRenderer {

  constructor(options) {
    super();

    this._options = options;
  }

  /**
   * Method to disable the brush effect used to make a selection (enabled by default).
   */
  disableBrush() {
    this._brushCanvas.on('.brush', null);
    this._brushCanvas.select('rect.overlay').attr('cursor', 'auto');
  }

  /**
   * Method to enable the brush effect used to make a selection (enabled by default).
   */
  enableBrush() {
    this._brushCanvas.call(this._brush);
    this._brushCanvas.select('rect.overlay').attr('cursor', 'crosshair');
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
  render(canvas, canvasHeight, xScale) {
    const xAxis = super.render(canvas, canvasHeight, xScale);

    const self = this;

    // Define the brush.
    this._brush = d3brush.brushX()
      .on('brush', function() {

        // Snap to rectangles on mousemove event.
        if (d3select.event.sourceEvent.type === 'mousemove') {

          // Identify the range selected. This won't be snapped to the grid.
          const selectionRange = d3select.event.selection.map(xScale.invert);

          // Use 'round' to snap to grid.
          let snappedRange = selectionRange.map(d3time.timeYear.round);

          // If empty when rounded, use floor instead.
          if (snappedRange[0] >= snappedRange[1]) {
            snappedRange[0] = d3time.timeYear.floor(selectionRange[0]);
            snappedRange[1] = d3time.timeYear.offset(snappedRange[0]);
          }

          // Snap to grid.
          d3select.select(this).call(d3select.event.target.move, snappedRange.map(xScale));

        }

      })
      .on('end', function() {

        // Identify the selection range.
        let selectionRange = [];

        if (d3select.event.selection) {
          // Selection was made, so snap to a grid.
          selectionRange = d3select.event.selection
            .map(xScale.invert)
            .map(d3time.timeYear.round);

        } else {

          // No selection made, so clearing selection.
          selectionRange = [];

        }

        // Emit the event.
        self._options.onSelectListeners.forEach((listener) => {
          listener.call(this, selectionRange);
        });

      });

    // Assign the brush.
    this._brushCanvas = canvas.select('.x-axis').append('g')
      .attr('class', 'brush');
    this._brushCanvas
      .call(this._brush);

  }

}
