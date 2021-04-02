/**
 *
 * The fundamental functions, e.g. init
 *
 */

import platform from 'platform'

import randomPhrases from './components/randomPhrases'
import { debug } from './constants'
import { getFullscreen } from './helpers'

class RemoteCalibrator {
  constructor() {
    this._initialized = false

    this._id = null

    this._environmentData = []

    this._displayData = []
    this._screenData = []
    this._viewingDistanceData = []
    this._gazePositionData = []
  }

  /* --------------------------------- GETTERS -------------------------------- */

  get id() {
    return this._id
  }

  /**
   * Help get a certain item from a given category
   */
  _helper_get(cat, name) {
    if (!cat.length) return null
    let thisData = cat[cat.length - 1]
    return name
      ? { value: thisData.value[name], timestamp: thisData.timestamp }
      : thisData
  }

  // Environment

  get browser() {
    if (!this._environmentData.length) this.environment()
    return this._helper_get(this._environmentData, 'browser')
  }

  get browserVersion() {
    if (!this._environmentData.length) this.environment()
    return this._helper_get(this._environmentData, 'browserVersion')
  }

  get model() {
    if (!this._environmentData.length) this.environment()
    return this._helper_get(this._environmentData, 'model')
  }

  get manufacturer() {
    if (!this._environmentData.length) this.environment()
    return this._helper_get(this._environmentData, 'manufacturer')
  }

  get engine() {
    if (!this._environmentData.length) this.environment()
    return this._helper_get(this._environmentData, 'engine')
  }

  get system() {
    if (!this._environmentData.length) this.environment()
    return this._helper_get(this._environmentData, 'system')
  }

  get systemFamily() {
    if (!this._environmentData.length) this.environment()
    return this._helper_get(this._environmentData, 'systemFamily')
  }

  get description() {
    if (!this._environmentData.length) this.environment()
    return this._helper_get(this._environmentData, 'description')
  }

  get fullDescription() {
    if (!this._environmentData.length) this.environment()
    return this._helper_get(this._environmentData, 'fullDescription')
  }

  // Screen

  get displayWidthPX() {
    if (!this._displayData.length) this.displaySize()
    return this._helper_get(this._displayData, 'displayWidthPX')
  }

  get displayHeightPX() {
    if (!this._displayData.length) this.displaySize()
    return this._helper_get(this._displayData, 'displayHeightPX')
  }

  get windowWidthPX() {
    if (!this._displayData.length) this.displaySize()
    return this._helper_get(this._displayData, 'windowWidthPX')
  }

  get windowHeightPX() {
    if (!this._displayData.length) this.displaySize()
    return this._helper_get(this._displayData, 'windowHeightPX')
  }

  get screenWidthCM() {
    return this._helper_get(this._screenData, 'screenWidthCM')
  }

  get screenHeightCM() {
    return this._helper_get(this._screenData, 'screenHeightCM')
  }

  get screenDiagonalCM() {
    return this._helper_get(this._screenData, 'screenDiagonalCM')
  }

  get screenDiagonalIN() {
    return this._helper_get(this._screenData, 'screenDiagonalIN')
  }

  get screenPPI() {
    return this._helper_get(this._screenData, 'screenPPI')
  }

  get screenPhysicalPPI() {
    return this._helper_get(this._screenData, 'screenPhysicalPPI')
  }

  // Distance

  get viewingDistanceCM() {
    return this._helper_get(this._viewingDistanceData)
  }

  // Gaze

  get gazePositionPX() {
    return this._helper_get(this._gazePositionData)
  }

  /* --------------------------------- SETTERS -------------------------------- */

  /**
   * @param {{ value: { displayWidthPX: number; displayHeightPX: number; windowWidthPX: number; windowHeightPX: number; }; timestamp: Date; }} data
   */
  set displayData(data) {
    this._displayData.push(data)
  }

  /**
   * @param {{ value: { screenWidthCM: number; screenHeightCM: number; screenDiagonalCM: number; screenDiagonalIN: number; screenPPI: number; screenPhysicalPPI: number; }; timestamp: Date; }} data
   */
  set screenData(data) {
    this._screenData.push(data)
  }

  /**
   * @param {{ value: number; timestamp: Date; }} data
   */
  set viewingDistanceData(data) {
    this._viewingDistanceData.push(data)
  }

  /**
   * @param {{ value: { x: number; y: number; }; timestamp: Date; }} data
   */
  set gazePositionData(data) {
    this._gazePositionData.push(data)
  }

  /**
   * @param {{ value: { browser: string; browserVersion: string; model: string; manufacturer: string; engine: string; system: string; systemFamily: string; description: string; fullDescription: string; }; timestamp: Date; }} data
   */
  set environmentData(data) {
    this._environmentData.push(data)
  }
}

/**
 *
 * Must be called before any other functions
 *
 */
RemoteCalibrator.prototype.init = function (options = {}, callback) {
  if (!this._initialized) {
    this._initialized = true
    options = Object.assign(
      {
        id: randomPhrases(),
        fullscreen: true,
      },
      options
    )

    if (options.fullscreen && !debug) getFullscreen()

    this._id = {
      value: options.id,
      timestamp: new Date(),
    }

    if (callback) callback(this._id)
  }
}

/**
 *
 * Get the environment data, e.g. browser type
 *
 */
RemoteCalibrator.prototype.environment = function (callback) {
  if (this.checkInitialized()) {
    const data = {
      value: {
        browser: platform.name,
        browserVersion: platform.version,
        model: platform.product,
        manufacturer: platform.manufacturer,
        engine: platform.layout,
        system: platform.os.toString(),
        systemFamily: platform.os.family,
        description: platform.description,
        fullDescription: platform.ua,
      },
      timestamp: this.id.timestamp,
    }

    this.environmentData = data

    if (callback) callback(data)
  }
}

/**
 *
 * Check if RemoteCalibrator is initialized
 *
 */
RemoteCalibrator.prototype.checkInitialized = function () {
  if (this._initialized) return true
  console.error('RemoteCalibrator is not initialized.')
  return false
}

export default RemoteCalibrator