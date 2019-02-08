import { Injectable } from '@angular/core';


@Injectable()
export class LoggerService {
  private _enabled = false;

  set enabled(val: boolean) {
    this._enabled = val;
  }

  public log(type, message) {
    if (this._enabled) {
      console.warn(`Type: ${type}`, ...message);
    }
  }

  public profileStart(label) {
    if (this._enabled) {
      this.log('PROFILE', 'Started - ' + label);
      console.profile(label);
    }
  }

  public profileStop(label) {
    if (this._enabled) {
      this.log('PROFILE', 'Finished - ' + label);
      console.profileEnd(label);
    }
  }

  public timeStart(label) {
    if (this._enabled) {
      this.log('TIMER', 'Started - ' + label);
      console.time(label);
    }
  }

  public timeStop(label) {
    if (this._enabled) {
      this.log('TIMER', 'Finished - ' + label);
      console.timeEnd(label);
    }
  }
}
