/**
 * Extends BarSeriesRenderer to allow the user to select one or more bars in the series and fires
 * a `SELECTED` event.
 */

const d3brush = require('d3-brush');
const d3select = require('d3-selection');
const d3time = require('d3-time');
const EventEmitter = require('events').EventEmitter;

const BarSeriesRenderer = require('./bar-series-renderer');

module.exports = class SelectableBarSeriesRenderer extends BarSeriesRenderer {

  /**
   * Constructor to instantiate EventEmitter reference.
   *
   * @param listeners.onSelectListeners {array of functions} [optional] A list of listeners to be
   * registered for {@link #_EVENT_SELECTED} events.
   */
  constructor(listeners) {
    super();

    // Define the supported events.
    this.EVENT_SELECTED = 'SELECTED';

    // Instantiate the EventEmitter.
    this._eventEmitter = new EventEmitter();

    // Register onSelectListeners.
    if (listeners && listeners.onSelectListeners) {
      listeners.onSelectListeners.forEach((listener) => {
        this._eventEmitter.on(this.EVENT_SELECTED, listener);
      }, this);
    }

  }

  /**
   * Getter method giving external classes access to the EventEmitter to register for events.
   */
  getEventEmitter() {
    return this._eventEmitter;
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
  render(bins, xScale, yScale, yValues, extraClasses) {
    super.render(bins, xScale, yScale, yValues, extraClasses);

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

        // Ensure a selection event is available.
        if (d3select.event.selection) {

          // Identify the selected range.
          const selectionRange = d3select.event.selection.map(xScale.invert);

          // Snap the range to year boundaries.
          let snappedRange = selectionRange.map(d3time.timeYear.round);

          // Trigger the event.
          self._eventEmitter.emit(self.EVENT_SELECTED, snappedRange);

        }

      });

    // Assign the brush.
    this._brushCanvas = this._canvas.append('g')
      .attr('class', 'brush');
    this._brushCanvas
      .call(this._brush);

  }

}
