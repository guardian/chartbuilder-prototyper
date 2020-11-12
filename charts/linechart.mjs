import { numberFormat } from '../utilities/numberFormat'

export default class LineChart {
  constructor(results) {
    let clone = JSON.parse(JSON.stringify(results))
    var data = clone["sheets"]["data"]
    var template = clone["sheets"]["template"]
    var labels = clone["sheets"]["labels"]
    var periods = clone["sheets"]["periods"]
    var userKey = clone["sheets"]["key"]
    var options = clone["sheets"]["options"]
    var optionalKey = {}
    var x_axis_cross_y = null

    if (userKey.length > 1) {
      userKey.forEach(function (d) {
        optionalKey[d.key] = d.colour
      })
    }
    console.log("key",optionalKey)

    function numberFormat(num) {
      if (num > 0) {
        if (num > 1000000000) {
          return (num / 1000000000) + "bn"
        }
        if (num > 1000000) {
          return (num / 1000000) + "m"
        }
        if (num > 1000) {
          return (num / 1000) + "k"
        }
        if (num % 1 != 0) {
          return num.toFixed(2)
        } else {
          return num.toLocaleString()
        }
      }
      if (num < 0) {
        var posNum = num * -1
        if (posNum > 1000000000) return ["-" + String((posNum / 1000000000)) + "bn"]
        if (posNum > 1000000) return ["-" + String((posNum / 1000000)) + "m"]
        if (posNum > 1000) return ["-" + String((posNum / 1000)) + "k"]
        else {
          return num.toLocaleString()
        }
      }
      return num
    }

    d3.select("#chartTitle").text(template[0].title)
    d3.select("#subTitle").text(template[0].subtitle)
    if (template[0].source != "") {
      d3.select("#sourceText").html(" | Source: " + template[0].source)
    }

    if (template[0].x_axis_cross_y) {
        if (template[0].x_axis_cross_y != "") {
        x_axis_cross_y = +template[0].x_axis_cross_y
        // x_axis_cross_y = null
      }
    }
    

    var chartKey = d3.select("#chartKey")

    var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)

    var isMobile = (windowWidth < 610) ? true : false ;

    var containerWidth = document.querySelector("#graphicContainer").getBoundingClientRect().width

    var height = containerWidth * 0.6

    var margin
    if (template[0]["margin-top"]) {
      margin = {
        top: +template[0]["margin-top"],
        right: +template[0]["margin-right"],
        bottom: +template[0]["margin-bottom"],
        left: +template[0]["margin-left"]
      }
    } else {
      margin = {
        top: 0,
        right: 0,
        bottom: 20,
        left: 40
      }
    }

    var lineLabelling = false;
    // if (options.length > 0) {
    //     if (options[0]["lineLabelling"]) {
    //       if (options[0]["lineLabelling"] != "") {
    //         lineLabelling = (options[0]["lineLabelling"] === true);
    //       }
    //     }
    // }
    
    var breaks = "yes"

    if (template[0]["breaks"]) {
      breaks = template[0]["breaks"]
    }

    var keys = Object.keys(data[0])

    var xVar

    if (template[0]["xColumn"]) {
      xVar = template[0]["xColumn"]
      keys.splice(keys.indexOf(xVar), 1)
    } else {
      xVar = keys[0]
      keys.splice(0, 1)
    }

  var colors;
  var colorsLong = ["#4daacf", "#5db88b", "#a2b13e", "#8a6929", "#b05cc6", "#c8a466", "#c35f95", "#ce592e", "#d23d5e", "#d89a34", "#7277ca", "#527b39", "#59b74b", "#c76c65", "#8a6929"]; 
  var colorsMedium = ["#000000","#0000ff","#9d02d7","#cd34b5","#ea5f94","#fa8775","#ffb14e","#ffd700"]
  var colorsShort = ["#ffb14e","#fa8775","#ea5f94","#cd34b5","#9d02d7","#0000ff"]
  var colors = ["#4daacf", "#5db88b", "#a2b13e", "#8a6929", "#b05cc6", "#c8a466", "#c35f95", "#ce592e", "#d23d5e", "#d89a34", "#7277ca", "#527b39", "#59b74b", "#c76c65", "#8a6929"]; // var colors = ["#000000","#0000ff","#9d02d7","#cd34b5","#ea5f94","#fa8775","#ffb14e","#ffd700"]

  if (keys.length <= 5) {
    colors = colorsShort;
  }

  else {
    colors = colorsLong
  }
    var width = containerWidth - margin.left - margin.right,
    height = height - margin.top - margin.bottom


    d3.select("#graphicContainer svg").remove()

    chartKey.html("")

    var svg = d3.select("#graphicContainer").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("id", "svg")
      .attr("overflow", "hidden")

    if (lineLabelling && !isMobile) {

      var longestKey = keys.sort(function (a, b) { return b.length - a.length; })[0];
      
      d3.select("#dummyText").remove()

      var dummyText = svg.append("text")
                      .attr("x", -50)
                      .attr("y", -50)
                      .attr("id", "dummyText")
                      .attr("class", "annotationText")
                      .text(longestKey)

      var keyLength = dummyText.node().getBBox().width                

      margin.right = margin.right + keyLength

    }

    width = containerWidth - margin.left - margin.right

    svg.attr("width", width + margin.left + margin.right)  

    var features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    var x

    if (typeof data[0][xVar] == "string") {
      x = d3.scaleTime().rangeRound([0, width])
    } else {
      x = d3.scaleLinear().rangeRound([0, width])
    }

    var y

    if (template[0]["yScaleType"]) {
      y = d3[template[0]["yScaleType"]]().range([height, 0]).nice()
    } else {
      y = d3.scaleLinear()
        .rangeRound([height, 0])
    }

    var color = d3.scaleOrdinal()
      .range(colors)

    var lineGenerators = {}
    var allValues = []

    keys.forEach(function (key) {
      if (breaks === "yes") {
        lineGenerators[key] = d3.line()
          .defined(function (d) {
            return d
          })
          .x(function (d) {
            return x(d[xVar])
          })
          .y(function (d) {
            return y(d[key])
          })
      } else {
        lineGenerators[key] = d3.line()
          .x(function (d) {
            return x(d[xVar])
          })
          .y(function (d) {
            return y(d[key])
          })
      }


      data.forEach(function (d) {
        if (typeof d[key] == "string") {

          if (d[key].includes(",")) {
            if (!isNaN((d[key]).replace(/,/g, ""))) {
              d[key] = +(d[key]).replace(/,/g, "")
              allValues.push(d[key])
            }

          } else if (d[key] != "") {

            if (!isNaN(d[key])) {
              d[key] = +d[key]
              allValues.push(d[key])
            }
          } else if (d[key] == "") {
            d[key] = null
          }

        } else {
          allValues.push(d[key])
        }


      })

    })

    // console.log(data)

    if (isMobile) {
      keys.forEach(function (key) {

        var keyDiv = chartKey.append("div")
          .attr("class", "keyDiv")

        keyDiv.append("span")
          .attr("class", "keyCircle")
          .style("background-color", function () {
            if (optionalKey.hasOwnProperty(key)) {
              return optionalKey[key]
            } else {
              return color(key)
            }
          })

        keyDiv.append("span")
          .attr("class", "keyText")
          .text(key)

      })
    }

    var parseTime = d3.timeParse(template[0]["dateFormat"])
    var parsePeriods = d3.timeParse(template[0]["periodDateFormat"])

    data.forEach(function (d) {
      if (typeof d[xVar] == "string") {
        d[xVar] = parseTime(d[xVar])
      }
    })

    var keyData = {}

    keys.forEach(function (key) {
      keyData[key] = []

      data.forEach(function (d) {
        if (d[key] != null) {
          let newData = {}
          newData[xVar] = d[xVar]
          newData[key] = d[key]
          keyData[key].push(newData)
        } else {
          keyData[key].push(null)
        }

      })
    })

    labels.forEach(function (d) {
      if (typeof d.x == "string") {
        d.x = parseTime(d.x)
      }

      if (typeof d.y == "string") {
        d.y = +d.y
      }

      if (typeof d.offset == "string") {
        d.offset = +d.offset
      }

    })

    periods.forEach(function (d) {
      if (typeof d.start == "string") {
        d.start = parsePeriods(d.start)
        d.end = parsePeriods(d.end)
        d.middle = new Date((d.start.getTime() + d.end.getTime()) / 2)
      }
    })

    var min
    var max = d3.max(allValues);


    if (template[0]["minY"]) {
        if (template[0]["minY"] != "") {
          console.log("yeg ")
          min = parseInt(template[0]["minY"])
        }

        else {
          min = d3.min(allValues)
      }
    }
    
    else {
      min = d3.min(allValues)
    }
    x.domain(d3.extent(data, function (d) {
      return d[xVar]
    }))

    console.log(min, max)
    y.domain([min, max])

    var xAxis
    var yAxis

    var yTicks

    if (template[0]["yScaleType"] == "scaleLog") {
         yAxis = d3.axisLeft(y).tickFormat(function (d) {
          return numberFormat(d)
        }).ticks(3)
    }

    else {
      yAxis = d3.axisLeft(y).tickFormat(function (d) {
          return numberFormat(d)
        }).ticks(5)
    }

    if (isMobile) {
      xAxis = d3.axisBottom(x).ticks(4)
  
    } else {
      xAxis = d3.axisBottom(x).ticks(6)
    }

    d3.selectAll(".periodLine").remove()
    d3.selectAll(".periodLabel").remove()

    features.selectAll(".periodLine")
      .data(periods)
      .enter().append("line")
      .attr("x1", function (d) {
        return x(d.start)
      })
      .attr("y1", 0)
      .attr("x2", function (d) {
        return x(d.start)
      })
      .attr("y2", height)
      .attr("class", "periodLine mobHide")
      .attr("stroke", "#bdbdbd")
      .attr("opacity", function (d) {
        if (d.start < x.domain()[0]) {
          return 0
        } else {
          return 1
        }

      })
      .attr("stroke-width", 1)

    features.selectAll(".periodLine")
      .data(periods)
      .enter().append("line")
      .attr("x1", function (d) {
        return x(d.end)
      })
      .attr("y1", 0)
      .attr("x2", function (d) {
        return x(d.end)
      })
      .attr("y2", height)
      .attr("class", "periodLine mobHide")
      .attr("stroke", "#bdbdbd")
      .attr("opacity", function (d) {
        if (d.end > x.domain()[1]) {
          return 0
        } else {
          return 1
        }

      })
      .attr("stroke-width", 1)

    features.selectAll(".periodLabel")
      .data(periods)
      .enter().append("text")
      .attr("x", function (d) {
        if (d.labelAlign == "middle") {
          return x(d.middle)
        } else if (d.labelAlign == "start") {
          return x(d.start) + 5
        }

      })
      .attr("y", -5)
      .attr("text-anchor", function (d) {
        return d.labelAlign

      })
      .attr("class", "periodLabel mobHide")
      .attr("opacity", 1)
      .text(function (d) {
        return d.label
      })

    features.append("g")
      .attr("class", "x")
      .attr("transform", function () {

        if (x_axis_cross_y != null) {

          return "translate(0," + y(x_axis_cross_y) + ")"
        } else {

          return "translate(0," + height + ")"
        }
      })
      .call(xAxis)

    features.append("g")
      .attr("class", "y")
      .call(yAxis)

    features.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("fill", "#767676")
      .attr("text-anchor", "end")
      .text(template[0].yAxisLabel)

    features.append("text")
      .attr("x", width)
      .attr("y", height - 6)
      .attr("fill", "#767676")
      .attr("text-anchor", "end")
      .text(template[0].xAxisLabel)

    d3.selectAll(".tick line")
      .attr("stroke", "#767676")

    d3.selectAll(".tick text")
      .attr("fill", "#767676")

    d3.selectAll(".domain")
      .attr("stroke", "#767676")


    keys.forEach(function (key) {

      features.append("path")
        .datum(keyData[key])
        .attr("fill", "none")
        .attr("stroke", function (d) {
          if (optionalKey.hasOwnProperty(key)) {
            return optionalKey[key]
          } else {
            return color(key)
          }

        })
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 2)
        .attr("d", lineGenerators[key])


      var tempLabelData = keyData[key].filter(d => d != null)
      console.log(tempLabelData)
      var end = tempLabelData.length - 1

      

      var lineLabelAlign = "start"
      var lineLabelOffset = 0

      if (x(tempLabelData[tempLabelData.length - 1].index) > width - 20) {
        lineLabelAlign = "end"
        lineLabelOffset = -10
      }

      if (!isMobile) {

        features.append("circle")
        .attr("cy", function (d) {
          return y(tempLabelData[tempLabelData.length - 1][key])
        })
        .attr("fill", function (d) {
          if (optionalKey.hasOwnProperty(key)) {
            return optionalKey[key]
          } else {
            return color(key)
          }

        })
        .attr("cx", function (d) {
          return x(tempLabelData[tempLabelData.length - 1][xVar])
        })
        .attr("r", 4)
        .style("opacity", 1)

        features.append("text")
          .attr("class", "annotationText")
          .attr("y", function (d) {
            return y(tempLabelData[tempLabelData.length - 1][key]) + 4 + lineLabelOffset
          })
          .attr("x", function (d) {
            console.log(x(tempLabelData[tempLabelData.length - 1][xVar]))
            return x(tempLabelData[tempLabelData.length - 1][xVar]) + 5
          })
          .style("opacity", 1)
          .attr("text-anchor", lineLabelAlign)
          .text(function (d) {
            return key
          })
      }



    })

    function textPadding(d) {
      if (d.offset > 0) {
        return 6
      } else {
        return -2
      }
    }

    function textPaddingMobile(d) {
      if (d.offset > 0) {
        return 8
      } else {
        return 4
      }
    }


    features.selectAll(".annotationLine")
      .data(labels)
      .enter().append("line")
      .attr("class", "annotationLine")
      .attr("x1", function (d) {
        return x(d.x)
      })
      .attr("y1", function (d) {
        return y(d.y)
      })
      .attr("x2", function (d) {
        return x(d.x)
      })
      .attr("y2", function (d) {
        return y(d.offset)
      })
      .style("opacity", 1)
      .attr("stroke", "#000")

    var footerAnnotations = d3.select("#footerAnnotations")

    footerAnnotations.html("")

    if (isMobile) {

      features.selectAll(".annotationCircles")
        .data(labels)
        .enter().append("circle")
        .attr("class", "annotationCircle")
        .attr("cy", function (d) {
          return y(d.offset) + textPadding(d) / 2
        })
        .attr("cx", function (d) {
          return x(d.x)
        })
        .attr("r", 8)
        .attr("fill", "#000")

      features.selectAll(".annotationTextMobile")
        .data(labels)
        .enter().append("text")
        .attr("class", "annotationTextMobile")
        .attr("y", function (d) {
          return y(d.offset) + textPaddingMobile(d)
        })
        .attr("x", function (d) {
          return x(d.x)
        })
        .style("text-anchor", "middle")
        .style("opacity", 1)
        .attr("fill", "#FFF")
        .text(function (d, i) {
          return i + 1
        })

      if (labels.length > 0) {
        footerAnnotations.append("span")
          .attr("class", "annotationFooterHeader")
          .text("Notes: ")
      }

      labels.forEach(function (d, i) {

        footerAnnotations.append("span")
          .attr("class", "annotationFooterNumber")
          .text(i + 1 + " - ")

        if (i < labels.length - 1) {
          footerAnnotations.append("span")
            .attr("class", "annotationFooterText")
            .text(d.text + ", ")
        } else {
          footerAnnotations.append("span")
            .attr("class", "annotationFooterText")
            .text(d.text)
        }

      })

    } else {

      features.selectAll(".annotationText")
        .data(labels)
        .enter().append("text")
        .attr("class", "annotationText")
        .attr("y", function (d) {
          console.log(textPadding(d))
          return y(d.offset) + -1*textPadding(d)
        })
        .attr("x", function (d) {
          return x(d.x)
        })
        .style("text-anchor", function (d) {
          return d.align
        })
        .style("opacity", 1)
        .text(function (d) {
          return d.text
        })

    }
  } // end init
}