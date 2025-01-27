import RemoteCalibrator from '../core'

import { constructInstructions, shuffle, blurAll } from '../helpers'
import { gazeCalibrationDotDefault, debug } from '../constants'
import { bindKeys, unbindKeys } from '../components/keyBinder'
import text from '../text.json'

// [Wait!], etc.
// const instPOutsideWarning = 'Keep your face centered in the video feed.'

const originalStyles = {
  video: false,
  gazer: false,
}

export function gazeCalibrationPrepare(RC, options) {
  if (RC.background)
    RC._replaceBackground(
      constructInstructions(options.headline, options.description)
    )
  else
    RC._addBackground(
      constructInstructions(options.headline, options.description)
    )
  RC._constructFloatInstructionElement(
    'gaze-system-instruction',
    'Starting up... Please wait.'
  )
}

/**
 * Pop an interface for users to calibrate the gazeTracker
 */
RemoteCalibrator.prototype.calibrateGaze = function (options = {}, callback) {
  ////
  if (!this.gazeTracker.checkInitialized('gaze', true)) return
  blurAll()
  ////

  options = Object.assign(
    {
      greedyLearner: false,
      calibrationCount: 5,
      headline: text.calibrateGaze.headline,
      description: text.calibrateGaze.description,
    },
    options
  )

  originalStyles.video = this.gazeTracker.webgazer.params.showVideo
  originalStyles.gazer = this.gazeTracker.webgazer.params.showGazeDot
  if (!originalStyles.video) this.showVideo(true)
  if (!originalStyles.gazer) this.showGazer(true)

  this.gazeTracker.webgazer.params.greedyLearner = options.greedyLearner
  gazeCalibrationPrepare(this, options)

  // this.instructionElement.innerHTML = instPOutsideWarning
  const calibrationDot = startCalibration(this, options, () => {
    this._removeBackground() // Remove calibration background when the calibration finished
    unbindKeys(bindKeysFunction)

    // TODO Pass timestamp into callback
    if (callback && typeof callback === 'function') callback()
  })

  const breakFunction = () => {
    calibrationDot.deleteSelf(false)
    this._removeBackground()

    this.showVideo(originalStyles.video)
    this.showGazer(originalStyles.gazer)
    originalStyles.video = false
    originalStyles.gazer = false

    unbindKeys(bindKeysFunction)
  }

  const bindKeysFunction = bindKeys({
    Escape: breakFunction,
  })
}

const startCalibration = (RC, options, onCalibrationEnded) => {
  RC._removeFloatInstructionElement()
  return new GazeCalibrationDot(RC, document.body, options, onCalibrationEnded)
}

class GazeCalibrationDot {
  constructor(RC, parent, options, endCalibrationCallback) {
    // Order
    this._randomOrder()

    this.RC = RC

    this.clickThreshold = debug ? 1 : options.calibrationCount // How many times required to click for each position
    this.clicks = 0

    this.position = this.order.shift()
    this.r = gazeCalibrationDotDefault.r

    // HTML div
    this.div = document.createElement('div')
    this.div.className = 'gaze-calibration-dot'
    this.clickDiv = document.createElement('div')
    this.clickDiv.className = 'gaze-calibration-dot-click'
    this.div.appendChild(this.clickDiv)

    this.clickText = document.createElement('span')
    this.clickText.className = 'gaze-calibration-dot-text'
    this.clickDiv.appendChild(this.clickText)
    this.clickText.innerHTML = this.clickThreshold

    Object.assign(this.div.style, {
      width: this.r + 'px',
      height: this.r + 'px',
      borderRadius: this.r / 2 + 'px',
    })
    Object.assign(this.clickDiv.style, {
      width: this.r - gazeCalibrationDotDefault.border + 'px',
      height: this.r - gazeCalibrationDotDefault.border + 'px',
      borderRadius: (this.r - gazeCalibrationDotDefault.border) / 2 + 'px',
      top: `${gazeCalibrationDotDefault.border / 2}px`,
      left: `${gazeCalibrationDotDefault.border / 2}px`,
    })

    this.parent = parent
    parent.appendChild(this.div)
    this.placeDot()

    this.clickDiv.addEventListener('click', this.takeClick.bind(this), false)
    this.endCalibrationCallback = endCalibrationCallback
  }

  placeDot() {
    // Width
    Object.assign(
      this.div.style,
      [
        { left: gazeCalibrationDotDefault.margin + 'px', right: 'unset' }, // 0
        {
          left: `calc(50% - ${gazeCalibrationDotDefault.r / 2}px)`,
          right: 'unset',
        }, // 1
        // { right: gazeCalibrationDotDefault.margin + 'px', left: 'unset' }, // 2
        {
          left:
            window.innerWidth -
            gazeCalibrationDotDefault.r -
            gazeCalibrationDotDefault.margin +
            'px',
          right: 'unset',
        }, // 2
      ][this.position[0]],
      [
        { top: gazeCalibrationDotDefault.margin + 'px', bottom: 'unset' }, // 0
        {
          top: `calc(50% - ${gazeCalibrationDotDefault.r / 2}px)`,
          bottom: 'unset',
        }, // 1
        // { bottom: gazeCalibrationDotDefault.margin + 'px', top: 'unset' }, // 2
        {
          top:
            window.innerHeight -
            gazeCalibrationDotDefault.r -
            gazeCalibrationDotDefault.margin +
            'px',
          bottom: 'unset',
        }, // 2
      ][this.position[1]]
    )
  }

  takeClick() {
    this.clicks++
    this.clickText.innerHTML = Number(this.clickText.innerHTML) - 1
    if (this.clicks >= this.clickThreshold) {
      if (this.order.length) {
        this.position = this.order.shift()
        this.clickText.innerHTML = this.clickThreshold
        this.placeDot()
        this.clicks = 0
      } else {
        // Finish calibration
        this.deleteSelf(true)
      }
    }
  }

  deleteSelf(finished = true) {
    this.clickDiv.removeEventListener('click', this.takeClick, false)
    this.parent.removeChild(this.div)

    // onCalibrationEnded
    if (finished) {
      this.RC.showVideo(originalStyles.video)
      this.RC.showGazer(originalStyles.gazer)
      originalStyles.video = false
      originalStyles.gazer = false

      this.endCalibrationCallback()
    }
  }

  _randomOrder() {
    this.order = []
    for (let i of [0, 1, 2]) for (let j of [0, 1, 2]) this.order.push([i, j])
    shuffle(this.order)
  }
}
