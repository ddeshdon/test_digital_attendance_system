// Beacon Service for Student App - Handles both real BLE scanning and simulation
export class BeaconService {
  constructor() {
    this.mockBeacons = [
      {
        uuid: 'D001A2B6-AA1F-4860-9E43-FC83C418FC58', // Active session
        major: 1,
        minor: 101,
        distance: 1.2,
        rssi: -45,
        classroom: 'R602',
        active: true
      },
      {
        uuid: 'B234C5D7-BB2F-4961-8F54-GD94D529GD69', // No active session
        major: 1,
        minor: 102,
        distance: 2.8,
        rssi: -65,
        classroom: 'R603',
        active: false
      },
      {
        uuid: 'EXPIRED-UUID-4860-9E43-FC83C418FC58', // Expired session
        major: 1,
        minor: 103,
        distance: 1.5,
        rssi: -50,
        classroom: 'R604',
        active: false
      }
    ];
  }

  async simulateBeaconScan() {
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate finding a beacon (80% chance of success)
    const foundBeacon = Math.random() > 0.2;
    
    if (foundBeacon) {
      // Return closest beacon (first one is active session)
      const beacon = this.mockBeacons[0];
      const randomDistance = Math.random() * 2 + 0.5; // Random distance 0.5-2.5m
      
      return {
        success: true,
        beacon: {
          ...beacon,
          timestamp: new Date().toISOString(),
          distance: randomDistance,
          rssi: -30 - (randomDistance * 10) // Simulate realistic RSSI
        }
      };
    } else {
      return {
        success: false,
        message: 'No classroom beacons detected nearby'
      };
    }
  }

  async scanForSpecificUUID(targetUUID) {
    // Simulate scanning for a specific UUID
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const beacon = this.mockBeacons.find(b => b.uuid === targetUUID);
    
    if (beacon) {
      return {
        success: true,
        beacon: {
          ...beacon,
          timestamp: new Date().toISOString(),
          distance: Math.random() * 2 + 0.5
        }
      };
    } else {
      return {
        success: false,
        message: 'Specified beacon not found'
      };
    }
  }

  async validateBeaconUUID(uuid) {
    // Check if UUID exists in active sessions
    const beacon = this.mockBeacons.find(b => b.uuid === uuid);
    
    if (!beacon) {
      return {
        valid: false,
        message: 'Beacon not recognized'
      };
    }

    return {
      valid: beacon.active,
      message: beacon.active ? 
        `Valid beacon for ${beacon.classroom}` : 
        'Beacon found but session is not active'
    };
  }

  generateMockBeaconUUID() {
    const timestamp = Date.now();
    const randomHex = Math.random().toString(16).substr(2, 8).toUpperCase();
    return `MOCK-${randomHex}-4860-9E43-${timestamp.toString(16).substr(-12).toUpperCase()}`;
  }

  // Real BLE scanning methods (for production use)
  async requestBluetoothPermissions() {
    // This would request actual Bluetooth permissions
    // For now, return true for demo purposes
    return true;
  }

  async startRealBeaconScan() {
    // This would integrate with react-native-beacons-manager or similar library
    // For demo purposes, we'll use simulation
    console.log('Starting real beacon scan (using simulation for demo)');
    return this.simulateBeaconScan();
  }
}

export const beaconService = new BeaconService();