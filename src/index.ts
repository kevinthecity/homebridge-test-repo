import { AccessoryPlugin, HAP, Logging } from 'homebridge';
import axios from 'axios';

interface LedState {
  on: boolean;
}

class MicroPythonLEDAccessory implements AccessoryPlugin {
  private readonly log: Logging;
  private readonly apiBaseUrl: string;
  private readonly lightService: HAP.Service;
  private readonly informationService: HAP.Service;

  constructor(log: Logging, config: any, api: HAP.API) {
    this.log = log;
    this.apiBaseUrl = config.apiBaseUrl;

    // Create the information service for the accessory
    this.informationService = new api.hap.Service.AccessoryInformation()
      .setCharacteristic(api.hap.Characteristic.Manufacturer, 'Custom')
      .setCharacteristic(api.hap.Characteristic.Model, 'MicroPython LED')
      .setCharacteristic(api.hap.Characteristic.SerialNumber, '001');

    // Create the light service for the accessory
    this.lightService = new api.hap.Service.Lightbulb(config.name);

    // Set up the "On" characteristic for the light service
    this.lightService.getCharacteristic(api.hap.Characteristic.On)
      .onSet(this.setOn.bind(this));
  }

  async setOn(value: boolean) {
    try {
      const ledState: LedState = {
        on: value
      };
      const response = await axios.post(`${this.apiBaseUrl}/led`, ledState);
      const newState = response.data.on;
      this.log.info(`Set LED state to: ${newState ? 'ON' : 'OFF'}`);
    } catch (error: any) {
      if (error.response) {
        this.log.error(`Error setting LED state: ${error.response.status} ${error.response.statusText}`);
      } else {
        this.log.error('Error setting LED state:', error.message);
      }
    }
  }

  getServices(): HAP.Service[] {
    return [this.informationService, this.lightService];
  }
}

export default (homebridge: HAP.API): void => {
  homebridge.registerAccessory('homebridge-micropython-led', 'MicroPythonLED', MicroPythonLEDAccessory);
};
