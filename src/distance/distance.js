import RemoteCalibrator from '../core'
import {
  constrain,
  constructInstructions,
  toFixedNumber,
  median,
  blurAll,
} from '../helpers'
import {
  _getCrossX,
  _cross,
  circleDeltaX,
  _getCircleBounds,
  _circle,
} from '../components/onCanvas'
import { bindKeys, unbindKeys } from '../components/keyBinder'
import { addButtons } from '../components/buttons'
import text from '../text.json'

const blindSpotHTML = `<canvas id="blind-spot-canvas"></canvas>`

/* -------------------------------------------------------------------------- */

export function blindSpotTest(RC, options, toTrackDistance = false, callback) {
  let ppi = 108 // Dangerous! Arbitrary value
  if (RC.screenPpi) ppi = RC.screenPpi.value
  else
    console.error(
      'Screen size measurement is required to get accurate viewing distance measurement.'
    )

  let inTest = true // Used to break animation
  let dist = [] // Take the MEDIAN after all tests finished
  let tested = 0 // options.repeatedTesting times

  // Add HTML
  const blindSpotDiv = document.createElement('div')
  blindSpotDiv.innerHTML = blindSpotHTML
  RC.background.appendChild(blindSpotDiv)
  RC._constructFloatInstructionElement(
    'blind-spot-instruction',
    `Keep your <span id="eye-side"></span> eye closed and focus on the cross.`
  )

  // Get HTML elements
  const c = document.querySelector('#blind-spot-canvas')
  const ctx = c.getContext('2d')

  const eyeSideEle = document.getElementById('eye-side')
  let eyeSide = (eyeSideEle.innerText = 'LEFT').toLocaleLowerCase()
  let crossX = _getCrossX(eyeSide, c.width)

  let circleBounds

  // Window resize
  const _resetCanvasSize = () => {
    c.style.width = (c.width = window.innerWidth) + 'px'
    c.style.height = (c.height = window.innerHeight) + 'px'
    crossX = _getCrossX(eyeSide, c.width)
    circleBounds = _getCircleBounds(eyeSide, crossX, c.width)
  }
  const resizeObserver = new ResizeObserver(() => {
    _resetCanvasSize()
  })
  resizeObserver.observe(RC.background)
  _resetCanvasSize()

  let circleX = circleBounds[eyeSide === 'left' ? 0 : 1]
  let tempX = circleX // Used to check touching bound
  let v = eyeSide === 'left' ? 1 : -1

  // ! KEY
  const breakFunction = () => {
    // ! BREAK
    inTest = false
    resizeObserver.unobserve(RC.background)
    RC._removeBackground()

    unbindKeys(bindKeysFunction)
  }

  // SPACE
  const finishFunction = () => {
    tested += 1
    // Average
    dist.push(
      toFixedNumber(_getDist(circleX, crossX, ppi), options.decimalPlace)
    )

    // Enough tests?
    if (Math.floor(tested / options.repeatTesting) === 2) {
      // ! Put dist into data and callback function
      const data = (RC.newViewingDistanceData = {
        value: toFixedNumber(median(dist), options.decimalPlace),
        timestamp: new Date(),
        method: 'Blind Spot',
      })
      if (callback) callback(data)

      // Break
      if (!toTrackDistance) {
        breakFunction()
      } else {
        // ! For tracking
        // Stop test
        inTest = false
        // Clear observer and keys
        resizeObserver.unobserve(RC.background)
        unbindKeys(bindKeysFunction)
      }
    } else if (tested % options.repeatTesting === 0) {
      // Switch eye side
      if (eyeSide === 'left')
        eyeSide = (eyeSideEle.innerText = 'RIGHT').toLocaleLowerCase()
      else eyeSide = (eyeSideEle.innerText = 'LEFT').toLocaleLowerCase()
      circleBounds = _getCircleBounds(eyeSide, crossX, c.width)
      circleX = circleBounds[eyeSide === 'left' ? 0 : 1]
      v = eyeSide === 'left' ? 1 : -1
      crossX = _getCrossX(eyeSide, c.width)
      circleBounds = _getCircleBounds(eyeSide, crossX, c.width)
    }
  }

  // Bind keys
  const bindKeysFunction = bindKeys({
    Escape: breakFunction,
    ' ': finishFunction,
  })
  addButtons(
    RC.background,
    {
      go: finishFunction,
      cancel: breakFunction,
    },
    RC.params.showCancelButton
  )

  // ! ACTUAL TEST
  const runTest = () => {
    // ctx.fillStyle = '#eee'
    // ctx.fillRect(0, 0, c.width, c.height)
    ctx.clearRect(0, 0, c.width, c.height)
    // ctx.beginPath()

    _cross(ctx, crossX, c.height / 2)

    _circle(ctx, circleX, c.height / 2)
    circleX += v * circleDeltaX
    tempX = constrain(circleX, ...circleBounds)
    if (circleX !== tempX) {
      circleX = tempX
      v = -v
    }

    if (inTest) {
      requestAnimationFrame(runTest)
    } else {
      ctx.clearRect(0, 0, c.width, c.height)
    }
  }

  requestAnimationFrame(runTest)
}

RemoteCalibrator.prototype.measureDistance = function (options = {}, callback) {
  /**
   * options -
   *
   * fullscreen: [Boolean]
   * quitFullscreenOnFinished: [Boolean] // TODO
   * repeatTesting: 2
   * decimalPlace: 1
   * headline: [String]
   * description: [String]
   *
   */

  ////
  if (!this.checkInitialized()) return
  blurAll()
  ////

  options = Object.assign(
    {
      fullscreen: false,
      quitFullscreenOnFinished: false,
      repeatTesting: 2,
      decimalPlace: 1,
      headline: text.measureDistance.headline,
      description: text.measureDistance.description,
    },
    options
  )
  // Fullscreen
  this.getFullscreen(options.fullscreen)
  // Add HTML
  this._addBackground()

  this._replaceBackground(
    constructInstructions(options.headline, options.description)
  )
  blindSpotTest(this, options, false, callback)
}

// Helper functions

function _getDist(x, crossX, ppi) {
  // .3937 - in to cm
  return Math.abs(crossX - x) / ppi / _getTanDeg(15) / 0.3937
}

function _getTanDeg(deg) {
  return Math.tan((deg * Math.PI) / 180)
}
