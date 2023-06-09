import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { ExampleHomebridgePlatform } from './platform';
import axios from 'axios';

interface LedState {
  on: boolean;
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */

export class ExamplePlatformAccessory {
  
  private service: Service;
  private readonly apiBaseUrl: string;
  private prevIsDoorOpen: boolean = false;

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.apiBaseUrl = "http://192.168.7.166:8080"

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Custom')
      .setCharacteristic(this.platform.Characteristic.Model, 'MicroPython LED')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, '001');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below
  }

    /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    try {
      const ledState: LedState = {
        on: value as boolean
      };
      
      this.platform.log.debug(`${this.apiBaseUrl}/api`);
      this.platform.log.debug(JSON.stringify(ledState, null, 2));

      const response = await axios.post(`${this.apiBaseUrl}/api`, ledState);
      const newState = response.data.on;
      console.log(`Set LED state to: ${newState ? 'ON' : 'OFF'}`);

      this.platform.log.debug('Set Characteristic On ->', value);

    } catch (error: any) {
      if (error.response) {
        console.error(`Error setting LED state: ${error.response.status} ${error.response.statusText}`);
      } else {
        console.error('Error setting LED state:', error.message);
      }
    }
  }
  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn() {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/is_open`);
      const newState = response.data.is_open;
      if (newState !== this.prevIsDoorOpen) {
        console.log(`LED state changed to: ${newState ? 'OPEN' : 'CLOSED'}`);
      }

      this.platform.log.debug('Get Characteristic On ->', this.prevIsDoorOpen);

      return newState;
    } catch (error: any) {
      if (error.response) {
        console.error(`Error getting LED state: ${error.response.status} ${error.response.statusText}`);
      } else {
        console.error('Error getting LED state:', error.message);
      }
    }
    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
  }
} 
