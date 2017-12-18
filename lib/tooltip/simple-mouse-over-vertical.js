const d3array = require('d3-array');
const d3select = require('d3-selection');

/**
 * Class for rendering the X-axis.
 */
module.exports = class SimpleMouseOverVerticalTooltip {

  constructor(options, canvas, canvasWidth, canvasHeight, xScale, yScale, chartData) {

    // Append a layer to display the results on mouse over. It is initially hidden.
    const tooltipCanvas = canvas
      .append('g')
      .attr('class', 'tooltip-canvas')
      .style('display', 'none');

    // Add a box for the values.
    // const tooltipPanel = tooltipCanvas
    //   .append()
    // Add a marker and text to the focus layer for each line chart. They will be moved later by
    // the mouse.
    chartData.forEach((_ignoreData, index) => {

      // Marker.
      const markerOptions = options.mouseOver.dataSeries[index].marker;
      const marker = tooltipCanvas.append(markerOptions.type)
        .attr('class', `marker-y-${index}`);
      if (markerOptions.type === 'circle') {
        marker
          .attr('r', markerOptions.radius)
          .attr('fill', markerOptions.fill || 'none')
          .attr('stroke', markerOptions.stroke);
      }

      // Text.
      const textOptions = options.mouseOver.dataSeries[index].values;
      if (textOptions) {
        const text = tooltipCanvas.append('text')
          .attr('class', `value-y-${index}`);
      }
    });

    // Append a layer for capture the mouse.
    canvas
      .append('rect')
      .attr('class', 'mouse-capture')
      .attr('width', canvasWidth)
      .attr('height', canvasHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', function() {
        tooltipCanvas.style('display', null);
      })
      .on('mouseout', function() {
        tooltipCanvas.style('display', 'none');
      })
      .on('mousemove', mousemove);

    function mousemove() {
      // Identify the date the mouse selected.
      const mouseDate = xScale.invert(d3select.mouse(this)[0]);

      // Identify the bin the date falls in.
      const searchBins = chartData[0].bins;
      let binIndex = 0;
      let isFound = false;
      while (binIndex < searchBins.length && !isFound) {
        const bin = searchBins[binIndex];
        if (bin.x0 <= mouseDate && mouseDate <= bin.x1 ) {
          isFound = true;
        } else {
          binIndex++;
        }
      }

      // If the mouse is closer to the end of the bin than the start, use the following bin if one
      // exists.
      let mouseBin = searchBins[binIndex];
      if (mouseDate - mouseBin.x0 > mouseBin.x1 - mouseDate) {
        if (binIndex < searchBins.length - 1) {
          binIndex++;
        }
      }

      // Respond to the mouse move.
      chartData.forEach((_ignoreData, index) => {

        const _chartData = chartData[index];
        const binCount = _chartData.bins.length;
        const _bin = _chartData.bins[binIndex];

        // Marker
        const id = `marker-y-${index}`;
        tooltipCanvas.select(`.marker-y-${index}`)
          .attr('transform', 'translate(' + xScale(_bin.x0) + ',' + yScale(_bin.mean) + ')');

        // Value.
        let x = xScale(_bin.x0);
        let y = yScale(_bin.mean);
        const text = tooltipCanvas.select(`.value-y-${index}`);
        if (binIndex < (binCount / 2)) {
          text.attr('text-anchor', 'start');
          const nextY = yScale(_chartData.bins[binIndex + 1].mean);
          if (nextY > y) {
            y = y - 20;
          } else {
            y = y + 20;
          }
        } else {
          text.attr('text-anchor', 'end');
          const previousY = yScale(_chartData.bins[binIndex - 1].mean);
          if (previousY > y) {
            y = y - 20;
          } else {
            y = y + 20;
          }
        }
        if (y < 20) {
          y = 20;
        }
        if (y > (canvasHeight - 20)) {
          y = canvasHeight - 20;
        }
        text
          .attr('dx', x)
          .attr('dy', y)
          .text(function () {
            const value = _bin.mean;
            const textOptions = options.mouseOver.dataSeries[index].values;
            const decimals = (textOptions.decimals ? textOptions.decimals : 0);
            const multiplier = Math.pow(10, decimals);
            return (Number.isNaN(value) ? 0 : Math.round(value * multiplier) / multiplier);
          });
      });
    }
  }

};
