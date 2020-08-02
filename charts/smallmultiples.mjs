import moment from 'moment'
import mustache from '../utilities/mustache'
import helpers from '../utilities/helpers'

export default class SmallMultiples {

  constructor(results) {

    var self = this
    var data = results.sheets.data
    var details = results.sheets.template
    var keys = [...new Set(data.map(d => d.State))]
    var tooltip = (details[0].tooltip != "") ? true : false ;
    var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

    data.forEach(function (d) {
      if (typeof d.Cases == "string") {
        d.Cases = +d.Cases
      }
      if (typeof d.Date == "string") {
        let timeParse = d3.timeParse("%Y-%m-%d")
        d.Date = timeParse(d.Date)
      }
    })

    if (tooltip) {

      this.tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .attr("id", "tooltip")
          .style("position", "absolute")
          .style("background-color", "white")
          .style("opacity", 0)
    }

    this.data = data

    this.keys = keys

    this.details = details

    this.isMobile = (windowWidth < 610) ? true : false ;

    this.hasTooltip = tooltip

    this.template = details[0].tooltip

    this.showGroupMax = true

    d3.select("#switch").on("click", function() {

      self.showGroupMax = (self.showGroupMax) ? false : true ;

      var label = (self.showGroupMax) ? "Show max scale for each chart" : "Show max scale for group" ;

      d3.select(this).html(label)

    })

    this.render()

  }

  render() {

    var self = this

    d3.select("#graphicContainer").selectAll("svg").remove()

    d3.select("#graphicContainer").html("")

    for (var keyIndex = 0; keyIndex < this.keys.length; keyIndex++) {

      this._drawSmallChart(self.data, keyIndex, self.keys, self.details, self.isMobile, self.hasTooltip)

    }

  }

  _drawSmallChart(data, index, key, details, isMobile, tooltip) {

    var self = this

    var numCols

    var containerWidth = document.querySelector("#graphicContainer").getBoundingClientRect().width

    if (containerWidth < 500) {
      numCols = 1
    } else if (containerWidth < 750) {
      numCols = 2
    } else {
      numCols = 3
    }

    var width = document.querySelector("#graphicContainer").getBoundingClientRect().width / numCols
    var height = width * 0.5
    var margin
    if (details[0]["margin-top"]) {
      margin = {
        top: +details[0]["margin-top"],
        right: +details[0]["margin-right"],
        bottom: +details[0]["margin-bottom"],
        left: +details[0]["margin-left"]
      }
    } else {
      margin = {
        top: 0,
        right: 0,
        bottom: 20,
        left: 50
      }
    }

    width = width - margin.left - margin.right

    height = height - margin.top - margin.bottom

    d3.select("#graphicContainer").append("div").attr("id", key[index]).attr("class", "barGrid")

    let hashString = "#"

    let keyId = hashString.concat(key[index])

    d3.select(keyId).append("div").text(key[index]).attr("class", "chartSubTitle")

    var svg = d3.select(keyId).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).attr("overflow", "hidden")
    
    var features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    
    var keys = Object.keys(data[0])

    var x = d3.scaleBand().range([0, width]).paddingInner(0.08)

    var y = d3.scaleLinear().range([height, 0])

    var duration = 1000;

    var yMax = (this.showGroupMax) ? data : data.filter(item => item.State === key[index]);

    x.domain(data.map((d) => d.Date))

    y.domain(d3.extent(yMax, (d) => d.Cases)).nice()

    var tickMod = Math.round(x.domain().length / 3)

    var ticks = x.domain().filter((d, i) => !(i % tickMod) || i === x.domain().length - 1)

    var xAxis = d3.axisBottom(x).tickValues(ticks).tickFormat(d3.timeFormat("%d %b"))

    var yAxis = d3.axisLeft(y).tickFormat((d) => d).ticks(5)

    features.append("g").attr("class", "x").attr("transform", "translate(0," + height + ")").call(xAxis)

    features.append("g").attr("class", "y")

    function update() {

      yMax = (self.showGroupMax) ? data : data.filter(item => item.State === key[index]);

      y.domain(d3.extent(yMax, (d) => d.Cases))

      var bars = features.selectAll(".bar")
        .data(data.filter(d => d.State === key[index]))

      bars
        .enter()
        .append("rect")
        .attr("class", "bar")
        .style("fill", () => "rgb(204, 10, 17)")
        .attr('height', 0)
        .attr('y', height)
        .merge(bars)
        .transition()
        .duration(duration)
        .attr("x", (d) => x(d.Date))
        .attr("y", (d) => y(Math.max(d.Cases, 0)))
        .attr("width", x.bandwidth())
        .attr("height", (d) => Math.abs(y(d.Cases) - y(0)))


      d3.selectAll('.bar')
        .on("mouseover", function(d) {
          if (tooltip) {
            var text = mustache(self.template, { ...helpers,...d})
            self.tooltip.html(text)
            var tipWidth = document.querySelector("#tooltip").getBoundingClientRect().width
            if (d3.event.pageX < (width / 2)) {
              self.tooltip.style("left", (d3.event.pageX + tipWidth / 2) + "px")
            } else if (d3.event.pageX >= (width / 2)) {
              self.tooltip.style("left", (d3.event.pageX - tipWidth) + "px")
            }
            self.tooltip.style("top", (d3.event.pageY) + "px")
            self.tooltip.transition().duration(200).style("opacity", .9)
          }
        }).on("mouseout", function() {
          if (tooltip) {
            self.tooltip.transition().duration(500).style("opacity", 0)
          }
        })


      bars
        .exit()
        .transition()
        .duration(duration)
        .attr('height', 0)
        .attr('y', height)
        .remove();

      features.select('.y')
          .transition()
          .duration(duration)
          .call(yAxis);

    }

    document.getElementById("switch").addEventListener("click", () => update());

    update()

  }

}